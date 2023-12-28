import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DeployDialogContent } from "../dialog";
import React from 'react'
import '@testing-library/jest-dom'
import { requestAPI } from '../utils/util';
import { when } from 'jest-when'

jest.mock("../utils/util", () => ({
    requestAPI: jest.fn()
}))

const DEFAULT_VALID_API_KEY = "valid_api_key"
const DEFAULT_INVALID_API_KEY = "invalid_api_key"
const DEFAULT_PROJECT_ID = "project_id_abc"
const DEFAULT_JOB_ID = "job_id_abc"

/*
Mock the GET /apikey API
*/
const mockEnvWithAPI = (APIKey: any = null) => {
    when((requestAPI as jest.Mock)).calledWith("apikey").mockResolvedValue({
        data: APIKey
    })
}
/*
Mock the POST /apikey API
*/
const mockPostAPI = (result: any, api_key: string) => {
    when((requestAPI as jest.Mock)).calledWith("apikey", { "body": `{\"api_key\":\"${api_key}\"}`, "method": "POST" }).mockResolvedValue({
        result: result
    })
}

/*
Mock the job deploy API
There are three types of responses we are mocking:
1. Successful first time deployment of the notebook, the projectID should be skipped
2. Successful re-deplyoment of the notebook, the projectID should be provided
3. Failure deployment of the notebook, the projectID and the deployment_result should be provided
*/
const mockJobDeployResult = (projectID = "", deployment_result: object = {
    project_id: DEFAULT_PROJECT_ID,
    id: DEFAULT_JOB_ID
}) => {
    when((requestAPI as jest.Mock)).calledWith("job", { "body": `{\"api_key\":\"${DEFAULT_VALID_API_KEY}\",\"project_id\":\"${projectID}\"}`, "method": "POST" }).mockResolvedValue({
        deployment_result: deployment_result
    })
}

const renderDeployDialogContent = (project_id: any = null) => {
    if (!project_id) {
        render(<DeployDialogContent metadata={new Map()} />);
    } else {
        render(<DeployDialogContent metadata={new Map([["ploomber", { project_id: project_id }]])} />);
    }
}

describe("Test DeployDialogContent ", () => {


    describe("API Key Input Stage", () => {

        /* Before:
            1. No API Key saved in user's environment
        */
        beforeEach(() => {
            jest.clearAllMocks();
            mockEnvWithAPI()
        });

        /*
        Ensure layout components render properly
        */
        test("Test API Key Layout", async () => {
            renderDeployDialogContent();
            await waitFor(() => {
                expect(screen.getByLabelText('API Key')).toBeVisible()
                expect(screen.getAllByRole('link')[1]).toHaveTextContent('Click here to get an API Key')
                expect(screen.getByRole('button')).toHaveTextContent('CONFIRM')
            })
        })

        /*
        Test Flow: When the user inputs invalid API Key
        */
        test("Test Invalid API Key Input", async () => {
            mockPostAPI("fail", DEFAULT_INVALID_API_KEY)
            renderDeployDialogContent();
            await waitFor(() => {
                const inputBox = screen.getByLabelText('API Key')
                fireEvent.change(inputBox, { target: { value: DEFAULT_INVALID_API_KEY } })
                const confirmButton = screen.getByText('CONFIRM', { selector: 'button' })
                fireEvent.click(confirmButton)
            })
            await waitFor(() => {
                expect(screen.getByLabelText('Please enter valid API Key')).toBeVisible()
            })
        })

        /*
        Test Flow:
        1. When the user inputs valid API Key
        2. We will see the deploy button in next (assume the user)
        */
        test("Test Valid API Key Input Will Move To Deploy Stage", async () => {
            mockPostAPI("success", DEFAULT_VALID_API_KEY)
            renderDeployDialogContent();
            await waitFor(() => {
                const inputBox = screen.getByLabelText('API Key')
                fireEvent.change(inputBox, { target: { value: DEFAULT_VALID_API_KEY } })
                const confirmButton = screen.getByText('CONFIRM', { selector: 'button' })
                fireEvent.click(confirmButton)
            })
            expect(await screen.findByText('Confirm that you want to deploy this notebook to Ploomber Cloud')).toBeVisible()
        })
    })

    describe("API Deploy Stage", () => {

        /* Before:
            1. Valid API Key saved in user's environment
        */
        beforeEach(() => {
            jest.clearAllMocks();
            mockEnvWithAPI(DEFAULT_VALID_API_KEY);
        });

        /*
        Ensure layout components render properly
        */
        test("Test First Time Deployment Layout", async () => {
            renderDeployDialogContent();

            expect(await screen.findByText('Confirm that you want to deploy this notebook to Ploomber Cloud')).toBeVisible()
            expect(await screen.getByRole('button')).toHaveTextContent('CONFIRM')

        })
        /*
        Test Flow: When the notebook has not been deployed before
        */
        test("Test First Time Deployment Click Confim", async () => {
            mockJobDeployResult();
            renderDeployDialogContent();
            expect(await screen.findByText('Confirm that you want to deploy this notebook to Ploomber Cloud')).toBeVisible()
            expect(await screen.getByRole('button')).toHaveTextContent('CONFIRM')

            const confirmButton = screen.getByText('CONFIRM', { selector: 'button' })
            fireEvent.click(confirmButton)

            expect(await screen.findByText("Check your deployment status here:")).toBeVisible()
            expect(await screen.findByText(`https://platform.ploomber.io/dashboards/${DEFAULT_PROJECT_ID}/${DEFAULT_JOB_ID}`)).toBeVisible()
        })
        /*
        Test Flow: When the notebook has been deployed before
        */
        test("Test Existing Project Re-deployment Success", async () => {
            mockJobDeployResult(DEFAULT_PROJECT_ID);
            renderDeployDialogContent(DEFAULT_PROJECT_ID);
            expect(await screen.findByText("Check your deployment status here:")).toBeVisible()
            expect(await screen.findByText(`https://platform.ploomber.io/dashboards/${DEFAULT_PROJECT_ID}/${DEFAULT_JOB_ID}`)).toBeVisible()
        })
        /*
        Test Flow: When the community user deploys more than one active project
        */
        test("Test Community Users Only One Project Fail", async () => {
            mockJobDeployResult(DEFAULT_PROJECT_ID, {
                "message": "Community users are only allowed to have a single active project. Delete your current project to create a new one."
            });
            renderDeployDialogContent(DEFAULT_PROJECT_ID);
            expect(await screen.findByText("Community users are only allowed to have a single active project. Delete your current project to create a new one.")).toBeVisible()
        })
        /*
        Test Flow: When the directiory does not contain requirements.txt file
        */
        test("Test requirements.txt file is missing in directiory", async () => {
            mockJobDeployResult(DEFAULT_PROJECT_ID, {
                "detail": "/Users/tonykuo/requirements.txt",
                "type": "missing file"
            });


            renderDeployDialogContent(DEFAULT_PROJECT_ID);
            await waitFor(() => {
                expect(screen.getByTestId('error-message-area')).toHaveTextContent('A requirements.txt file with dependencies is required to deploy your notebook. Please add it at /Users/tonykuo/requirements.txt. To learn more, see the docs')

            })
        })
    })

})