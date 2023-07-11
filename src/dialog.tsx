import React, { useEffect, useState } from 'react';
import { ReactWidget } from '@jupyterlab/apputils'
import { Dialog as jupyterlabDialog } from '@jupyterlab/apputils';
import { Box, Button, Chip, Grid, Snackbar, TextField, Link, CircularProgress, Typography } from '@mui/material';
import CloudQueue from '@mui/icons-material/CloudQueue';
import { DEPLOYMENT_ENDPONTS } from './const/env';
import { requestAPI } from './utils/util';


export function showDeploymentDialog(panel: any, context: any) {
    const dialogWidget = new DialogWidget({ notebookPath: panel.context.contentsModel.path, metadata: panel.model.metadata, context: context });
    var deploymentDialog = new jupyterlabDialog({
        title: 'Deploy Notebook', body: dialogWidget, buttons: [
            {
                label: "Cancel",
                caption: "",
                className: "",
                accept: false,
                actions: [],
                displayType: "default",
                iconClass: "",
                iconLabel: "",
            }
        ]
    })
    return deploymentDialog.launch()
}


const DialogContent = (props: any): JSX.Element => {
    // For deployment workflow, we need:
    // 1. The path of notebook file 
    // 2. project_id value stored in notebook file
    const notebook_relative_path = props.notebook_path;
    const [projectId] = useState(props?.metadata?.get("project_id") || "");

    const [isLoadingRemoteAPI, setIsLoadingRemoteAPI] = useState(true);
    const [isLoadingDeployStatus, setIsLoadingDeployStatus] = useState(false);
    const [isShowSnackbar, setIsShowSnackbar] = useState(false)
    const [isShowFirstTimeDeployPrompt, setIsShowFirstTimeDeployPrompt] = useState(false)

    const [APIKey, setAPIKey] = useState("");
    const [deploymentURL, setDeploymentURL] = useState(null);
    const [APIValidStatus, setAPIValidStatus] = useState("init")
    const [deployErrorMessage, setDeployErrorMessage] = useState("")


    useEffect(() => {
        fetchAPIKey()
    }, [])

    // When API Key is verified, init. the first time deployment flow
    useEffect(() => {
        if (APIValidStatus === "success") {
            if (!projectId) {
                setIsShowFirstTimeDeployPrompt(true)
            } else {
                setIsShowFirstTimeDeployPrompt(false)
                deployNotebook()
            }
        }
    }, [APIValidStatus])


    // The API Key should stored in config file 
    const fetchAPIKey = async () => {

        await requestAPI<any>('apikey')
            .then(response => {
                if (response?.data != null) {
                    setAPIKey(response.data)
                    setAPIValidStatus("success")
                }
            }).catch(reason => {
                console.error(
                    `The jupyterlab_examples_server server extension appears to be missing.\n${reason}`
                );
            });
        setIsLoadingRemoteAPI(false);
    }

    const onSaveAPIKey = async () => {
        // When the user enters the API Key, store in the config file through /dashboard/apikey API
        setIsLoadingRemoteAPI(true);

        const dataToSend = { 'api_key': APIKey };
        await requestAPI<any>('apikey', {
            body: JSON.stringify(dataToSend),
            method: 'POST'
        }).then(reply => {
            setAPIValidStatus("success")
        }).catch(reason => {
            console.error(
                `Error on POST ${dataToSend}.\n${reason}`
            );
        });
        setIsLoadingRemoteAPI(false)
    }

    const onClickFirstTimeDeploy = async () => {
        setIsShowFirstTimeDeployPrompt(false)
        await deployNotebook()
    }

    const deployNotebook = async () => {
        setIsLoadingDeployStatus(true)
        const dataToSend = { 'notebook_path': notebook_relative_path, 'api_key': APIKey, 'project_id': projectId };
        await requestAPI<any>('job', {
            body: JSON.stringify(dataToSend),
            method: 'POST'
        }).then(reply => {
            var result = reply["deployment_result"]
            if (result.detail || result.message) {
                var errorMsg = result.detail || result.message
                setDeployErrorMessage(errorMsg)
            } else {
                setDeploymentURL(DEPLOYMENT_ENDPONTS.NEW_JOB + result.project_id + "/" + result.id)
                props?.metadata?.set("project_id", result.project_id)
                props.context.save()
            }
            // Write into notebook projectID
        }).catch(reason => {
            setDeployErrorMessage(reason)
        });

        setIsLoadingDeployStatus(false)

    }

    const APITextFieldProps: { [status: string]: any } = {
        "init": {
            label: "API Key",
            variant: "outlined",
            color: "primary"
        },
        "success": {
            label: "Valid API Key",
            variant: "filled",
            color: "success"
        },
        "error": {
            label: "Please enter valid API Key",
            variant: "filled",
            color: "warning"
        }
    }
    return (
        <Box p={6} style={{ width: 600 }}>
            {isLoadingRemoteAPI || isLoadingDeployStatus ?
                <Box sx={{
                    display: 'flex', justifyContent: "center",
                    alignItems: "center"
                }} >
                    <CircularProgress />
                </Box>
                : <>
                    <Grid container spacing={4} alignItems="center" direction="column">
                        {APIValidStatus !== "success" &&
                            <div>
                                <Grid item container direction='row' alignItems="center" width={"100%"}>
                                    <Grid container direction="row" alignItems="center" spacing={1}>
                                        <Grid item xs={10}>
                                            <TextField id="api-key"
                                                size="small"
                                                onChange={(val) => { setAPIKey(val.target.value) }}
                                                value={APIKey}
                                                label={APITextFieldProps[APIValidStatus]["label"]}
                                                variant={APITextFieldProps[APIValidStatus]["variant"]}
                                                color={APITextFieldProps[APIValidStatus]["color"]}
                                                error={APIValidStatus == "error"}
                                                fullWidth={true}
                                                focused
                                            />
                                        </Grid>
                                        <Grid item xs={2} alignItems="center" justifyContent="center">
                                            <Button onClick={onSaveAPIKey} variant="contained" size="small">CONFIRM</Button>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid item container direction='row' alignItems="center" width={"100%"}>
                                    <Link href={DEPLOYMENT_ENDPONTS.REGISTER_API} target="_blank" rel="noopener noreferrer">Click here to get an API Key</Link>
                                </Grid>

                            </div>
                        }
                        {APIValidStatus == "success" &&
                            <Grid item container alignItems="center" spacing={4} direction="column">
                                {!isShowFirstTimeDeployPrompt ? <>
                                    {deployErrorMessage ? <Typography variant="subtitle1" gutterBottom>{deployErrorMessage}</Typography> :
                                        <>
                                            <Grid item justifyContent="center" xs={12}>
                                                Check your deployment status here:

                                            </Grid>
                                            <Grid item justifyContent="center" xs={12}>
                                                <Chip label={deploymentURL} variant="outlined" onClick={() => {
                                                    navigator.clipboard.writeText(deploymentURL)
                                                    setIsShowSnackbar(true)
                                                }} />
                                                <Snackbar
                                                    open={isShowSnackbar}
                                                    onClose={() => setIsShowSnackbar(false)}
                                                    autoHideDuration={2000}
                                                    message="Copied to clipboard"
                                                />
                                            </Grid>
                                        </>
                                    }
                                </> : <>
                                    <>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Clicking on deploy will upload your notebook to Ploomber Cloud servers
                                        </Typography>
                                        <Button onClick={onClickFirstTimeDeploy} variant="contained" size="small" color="primary" disabled={deploymentURL} endIcon={<CloudQueue />}>CONFIRM </Button>
                                    </>
                                </>}
                            </Grid>
                        }
                    </Grid>

                </>}
        </Box >
    );
};

class DialogWidget extends ReactWidget {
    private state: any
    constructor(props: any) {
        super();
        this.state = {
            notebookPath: props.notebookPath,
            metadata: props.metadata,
            context: props.context
        }
    }
    render(): JSX.Element {
        return <DialogContent notebook_path={this.state.notebookPath} metadata={this.state.metadata} context={this.state.context} />;
    }
}
