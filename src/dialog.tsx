import React, { useEffect, useState } from 'react';
import { ReactWidget } from '@jupyterlab/apputils'
import { Dialog as jupyterlabDialog } from '@jupyterlab/apputils';
import { Box, Button, Chip, Grid, Snackbar, TextField, Link, CircularProgress, Typography } from '@mui/material';
import CloudQueue from '@mui/icons-material/CloudQueue';


export function showDeploymentDialog() {
    const reactWidget = new MainWidget();
    var deploymentDialog = new jupyterlabDialog({ title: 'Deploy Notebook', body: reactWidget })
    return deploymentDialog.launch()
}

export function showExperimentDialog(notebook: any) {
    const metadata = notebook.content.model.metadata;
    const reactWidget = new ExperimentWidget({ metadata: metadata });
    var deploymentDialog = new jupyterlabDialog({ title: 'Experiment Notebook', body: reactWidget })
    return deploymentDialog.launch()
}


const MainComponent = (): JSX.Element => {
    const MOCK_EXISTING_APIKEY = false
    const MOCK_FIRST_TIME_DEPLOY = false
    const [isLoadingRemoteAPI, setIsLoadingRemoteAPI] = useState(true);
    const [isLoadingDeployStatus, setIsLoadingDeployStatus] = useState(false);
    const [APIKey, setAPIKey] = useState("");
    const [deploymentURL, setDeploymentURL] = useState(null);
    const [APIValidStatus, setAPIValidStatus] = useState("init")
    const [isShowSnackbar, setIsShowSnackbar] = useState(false)
    const [isShowFirstTimeDeployPrompt, setIsShowFirstTimeDeployPrompt] = useState(false)
    useEffect(() => {
        fetchRemoteAPI()
    }, [])
    const fetchRemoteAPI = async () => {
        // Simulate remote fetching, 
        setTimeout(() => {
            if (MOCK_EXISTING_APIKEY) {
                setAPIKey("4dae0c4b-3447-432d-8c8f")
                setAPIValidStatus("success")
            }
            setIsLoadingRemoteAPI(false);
        }, 1000)
    }

    const onSaveRemoteAPI = async () => {
        // Simulate remote validating, 
        setIsLoadingRemoteAPI(true);
        setDeploymentURL(null)
        setTimeout(() => {
            if (APIKey == "") {
                setAPIValidStatus("error")
            } else {
                setAPIValidStatus("success")
            }
            setIsLoadingRemoteAPI(false)
        }, 1000)

    }

    const onPostDeploy = async () => {
        setIsLoadingDeployStatus(true);
        setTimeout(() => {
            setIsLoadingDeployStatus(false)
            if (MOCK_FIRST_TIME_DEPLOY) {
                if (!isShowFirstTimeDeployPrompt) {
                    setIsShowFirstTimeDeployPrompt(true)
                    return
                }
                setIsShowFirstTimeDeployPrompt(false)
            }
            setDeploymentURL("https://ploomber.io/some_random_url/" + APIKey)

        }, 1000)

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
                                            <Button onClick={onSaveRemoteAPI} variant="contained" size="small">CONFIRM</Button>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid item container direction='row' alignItems="center" width={"100%"}>
                                    <Link href="#">New API Key</Link>
                                </Grid>

                            </div>
                        }
                        {APIValidStatus == "success" && !isLoadingRemoteAPI &&
                            <Grid item container alignItems="center" spacing={4} direction="column">

                                {isShowFirstTimeDeployPrompt ? <Grid item xs={12} alignItems="center" justifyContent="center">
                                    {/* First Time Deploy Prompt */}
                                    <Typography variant="subtitle1" gutterBottom>
                                        Confirm to deploy
                                    </Typography>
                                    <Button onClick={onPostDeploy} variant="contained" size="small" color="primary" disabled={deploymentURL} endIcon={<CloudQueue />}>CONFIRM </Button>
                                </Grid> :
                                    <Grid item justifyContent="center" xs={12}>
                                        <Button onClick={onPostDeploy} variant="contained" size="small" color="primary" disabled={deploymentURL} endIcon={<CloudQueue />}>DEPLOY NOTEBOOK </Button>
                                    </Grid>
                                }
                                {deploymentURL &&
                                    <Grid item justifyContent="center" xs={12}>
                                        URL:
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
                                }
                            </Grid>
                        }
                    </Grid>

                </>}
        </Box >
    );
};

const ExperimentComponent = (props: any): JSX.Element => {
    const flattenText = JSON.stringify(Array.from(props.metadata.entries()))
    return (
        <>
            {flattenText}
        </>
    );
};

const MyButtonComponent = (): JSX.Element => {
    return (
        <button>My button</button>
    )
}
class MainWidget extends ReactWidget {
    constructor() {
        super();
    }
    render(): JSX.Element {
        return <MainComponent />;
    }
}

class ExperimentWidget extends ReactWidget {
    private metadata: object
    constructor(props: any) {
        super(props);
        // debugger;
        console.log("props: ", props.metadata._map)
        this.metadata = props.metadata._map
    }
    render(): JSX.Element {
        return <ExperimentComponent metadata={this.metadata} />;
    }
}

export class MyButtonWidget extends ReactWidget {
    constructor(notebook: any) {
        console.log("notebook: ", notebook)
        super();
    }
    render(): JSX.Element {
        return <MyButtonComponent />;
    }
}
