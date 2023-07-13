import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DialogContent } from "../dialog";
import React from 'react'
import '@testing-library/jest-dom'
import { requestAPI } from '../utils/util';
import { when } from 'jest-when'

jest.mock("../utils/util", () => ({
    requestAPI: jest.fn()
}))

describe("Test DialogContent ", () => {
    beforeEach(() => jest.resetModules());

    describe("API Key Input Stage", () => {

        test("Test API Key Layout", async () => {
            (requestAPI as jest.Mock).mockImplementation(() => Promise.resolve({ data: null }))
            render(<DialogContent />);
            await waitFor(() => {
                expect(screen.getByLabelText('API Key')).toBeVisible()
                expect(screen.getByRole('link')).toHaveTextContent('Click here to get an API Key')
                expect(screen.getByRole('button')).toHaveTextContent('CONFIRM')
            })

            // TODO: test open link test case
        })

        test("Test Invalid API Key Input", async () => {
            (requestAPI as jest.Mock).mockImplementation(() => Promise.resolve({ data: null }))
            render(<DialogContent />);
            await waitFor(() => {
                const inputBox = screen.getByLabelText('API Key')
                fireEvent.change(inputBox, { target: { value: '456' } })
                const confirmButton = screen.getByText('CONFIRM', { selector: 'button' })
                fireEvent.click(confirmButton)
            })
            await waitFor(() => {
                const inputBox = screen.getByLabelText('Please enter valid API Key')
            })
        })

        test("Test Valid API Key Input", async () => {
            (requestAPI as jest.Mock).mockImplementation(() => Promise.resolve({ data: null }))
            // Need to mock the API put API as success
            when((requestAPI as jest.Mock)).calledWith("apikey", { "body": "{\"api_key\":\"456\"}", "method": "POST" }).mockResolvedValue({
                result: "success"
            })

            render(<DialogContent />);
            await waitFor(() => {
                const inputBox = screen.getByLabelText('API Key')
                fireEvent.change(inputBox, { target: { value: '456' } })
                const confirmButton = screen.getByText('CONFIRM', { selector: 'button' })
                fireEvent.click(confirmButton)
            })
            expect(await screen.findByText('Clicking on deploy will upload your notebook to Ploomber Cloud servers')).toBeVisible()
        })
    })
    describe("API Deploy Stage", () => {

        beforeEach(() => jest.clearAllMocks());

        test("Test First Time Deployment Layout", async () => {
            (requestAPI as jest.Mock).mockImplementation(() => Promise.resolve({ data: "test123" }))
            render(<DialogContent />);

            expect(await screen.findByText('Clicking on deploy will upload your notebook to Ploomber Cloud servers')).toBeVisible()
            expect(await screen.getByRole('button')).toHaveTextContent('CONFIRM')

        })

        test("Test First Time Deployment Click CONFIRM", async () => {
            // (requestAPI as jest.Mock).mockImplementation(() => Promise.resolve({ data: "test123" }))
            when((requestAPI as jest.Mock)).calledWith("apikey").mockResolvedValue({
                data: "test123"
            })
            when((requestAPI as jest.Mock)).calledWith("job", { "body": "{\"api_key\":\"test123\",\"project_id\":\"\"}", "method": "POST" }).mockResolvedValue({
                deployment_result: {
                    project_id: "test_project_id",
                    id: "test_id"
                }
            })


            render(<DialogContent metadata={new Map()} />);
            expect(await screen.findByText('Clicking on deploy will upload your notebook to Ploomber Cloud servers')).toBeVisible()
            expect(await screen.getByRole('button')).toHaveTextContent('CONFIRM')

            const confirmButton = screen.getByText('CONFIRM', { selector: 'button' })
            fireEvent.click(confirmButton)

            expect(await screen.findByText('Check your deployment status here:')).toBeVisible()
            screen.debug()
        })
    })

})