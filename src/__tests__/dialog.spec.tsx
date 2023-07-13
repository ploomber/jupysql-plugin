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

        beforeEach(() => jest.clearAllMocks());

        test("Test First Time Deployment Layout", async () => {
            mockEnvWithAPI(DEFAULT_VALID_API_KEY);
            renderDialogContent();

            expect(await screen.findByText('Clicking on deploy will upload your notebook to Ploomber Cloud servers')).toBeVisible()
            expect(await screen.getByRole('button')).toHaveTextContent('CONFIRM')

        })

        test("Test First Time Deployment Click Confim", async () => {
            mockEnvWithAPI(DEFAULT_VALID_API_KEY);
            when((requestAPI as jest.Mock)).calledWith("job", { "body": `{\"api_key\":\"${DEFAULT_VALID_API_KEY}\",\"project_id\":\"\"}`, "method": "POST" }).mockResolvedValue({
                deployment_result: {
                    project_id: DEFAULT_PROJECT_ID,
                    id: DEFAULT_JOB_ID
                }
            })

            renderDialogContent();
            expect(await screen.findByText('Clicking on deploy will upload your notebook to Ploomber Cloud servers')).toBeVisible()
            expect(await screen.getByRole('button')).toHaveTextContent('CONFIRM')

            const confirmButton = screen.getByText('CONFIRM', { selector: 'button' })
            fireEvent.click(confirmButton)

            expect(await screen.findByText("Check your deployment status here:")).toBeVisible()
            expect(await screen.findByText(`https://platform.ploomber.io/dashboards/${DEFAULT_PROJECT_ID}/${DEFAULT_JOB_ID}`)).toBeVisible()
            screen.debug()
        })

        test("Test Existing Project redeployment", async () => {
            mockEnvWithAPI(DEFAULT_VALID_API_KEY);
            when((requestAPI as jest.Mock)).calledWith("job", { "body": `{\"api_key\":\"${DEFAULT_VALID_API_KEY}\",\"project_id\":\"${DEFAULT_PROJECT_ID}\"}`, "method": "POST" }).mockResolvedValue({
                deployment_result: {
                    project_id: DEFAULT_PROJECT_ID,
                    id: DEFAULT_JOB_ID
                }
            })

            renderDialogContent(DEFAULT_PROJECT_ID)
            expect(await screen.findByText("Check your deployment status here:")).toBeVisible()
            expect(await screen.findByText(`https://platform.ploomber.io/dashboards/${DEFAULT_PROJECT_ID}/${DEFAULT_JOB_ID}`)).toBeVisible()
            screen.debug()
        })
    })

})