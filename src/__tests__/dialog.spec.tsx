import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DialogContent } from "../dialog";
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


const mockEnvWithAPI = (APIKey: any = null) => {
    when((requestAPI as jest.Mock)).calledWith("apikey").mockResolvedValue({
        data: APIKey
    })
}

const mockPostAPI = (result: any, api_key: string) => {
    when((requestAPI as jest.Mock)).calledWith("apikey", { "body": `{\"api_key\":\"${api_key}\"}`, "method": "POST" }).mockResolvedValue({
        result: result
    })
}

// If projectID is provided, the API is used for re-deployment
const mockJobDeployResult = (projectID = "", deployment_result: object = {
    project_id: DEFAULT_PROJECT_ID,
    id: DEFAULT_JOB_ID
}) => {
    when((requestAPI as jest.Mock)).calledWith("job", { "body": `{\"api_key\":\"${DEFAULT_VALID_API_KEY}\",\"project_id\":\"${projectID}\"}`, "method": "POST" }).mockResolvedValue({
        deployment_result: deployment_result
    })
}

const renderDialogContent = (project_id: any = null) => {
    if (!project_id) {
        render(<DialogContent metadata={new Map()} />);
    } else {
        render(<DialogContent metadata={new Map([["ploomber", { project_id: project_id }]])} />);
    }
}

describe("Test DialogContent ", () => {


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
            renderDialogContent();
            await waitFor(() => {
                expect(screen.getByLabelText('API Key')).toBeVisible()
                expect(screen.getByRole('link')).toHaveTextContent('Click here to get an API Key')
                expect(screen.getByRole('button')).toHaveTextContent('CONFIRM')
            })
        })

        /* 
        Test Flow: When the user inputs invalid API Key
        */
        test("Test Invalid API Key Input", async () => {
            mockPostAPI("fail", DEFAULT_INVALID_API_KEY)
            renderDialogContent();
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
            renderDialogContent();
            await waitFor(() => {
                const inputBox = screen.getByLabelText('API Key')
                fireEvent.change(inputBox, { target: { value: DEFAULT_VALID_API_KEY } })
                const confirmButton = screen.getByText('CONFIRM', { selector: 'button' })
                fireEvent.click(confirmButton)
            })
            expect(await screen.findByText('Clicking on deploy will upload your notebook to Ploomber Cloud servers')).toBeVisible()
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
            renderDialogContent();

            expect(await screen.findByText('Clicking on deploy will upload your notebook to Ploomber Cloud servers')).toBeVisible()
            expect(await screen.getByRole('button')).toHaveTextContent('CONFIRM')

        })
        /* 
        Test Flow: When the notebook have not been deployed before
        */
        test("Test First Time Deployment Click Confim", async () => {
            mockJobDeployResult();
            renderDialogContent();
            expect(await screen.findByText('Clicking on deploy will upload your notebook to Ploomber Cloud servers')).toBeVisible()
            expect(await screen.getByRole('button')).toHaveTextContent('CONFIRM')

            const confirmButton = screen.getByText('CONFIRM', { selector: 'button' })
            fireEvent.click(confirmButton)

            expect(await screen.findByText("Check your deployment status here:")).toBeVisible()
            expect(await screen.findByText(`https://platform.ploomber.io/dashboards/${DEFAULT_PROJECT_ID}/${DEFAULT_JOB_ID}`)).toBeVisible()
        })
        /* 
        Test Flow: When the notebook have been deployed before
        */
        test("Test Existing Project Re-deployment Success", async () => {
            mockJobDeployResult(DEFAULT_PROJECT_ID);
            renderDialogContent()
            expect(await screen.findByText('Clicking on deploy will upload your notebook to Ploomber Cloud servers')).toBeVisible()
            expect(await screen.getByRole('button')).toHaveTextContent('CONFIRM')
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
            renderDialogContent(DEFAULT_PROJECT_ID);
            expect(await screen.findByText("Community users are only allowed to have a single active project. Delete your current project to create a new one.")).toBeVisible()
        })
        /* 
        Test Flow: When the directiory is missing requirements.txt file
        */
        test("Test requirements.txt file is missing in directiory", async () => {
            mockJobDeployResult(DEFAULT_PROJECT_ID, {
                "detail": "Please make sure you have such file: /Users/tonykuo/requirements.txt"
            });
            renderDialogContent(DEFAULT_PROJECT_ID);
            expect(await screen.findByText("Please make sure you have such file: /Users/tonykuo/requirements.txt")).toBeVisible()
        })
    })

})