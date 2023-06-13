import React, { useEffect, useState } from 'react';
import { ReactWidget } from '@jupyterlab/apputils'
import { Dialog as jupyterlabDialog } from '@jupyterlab/apputils';
import { Box, Button, Chip, Grid, Skeleton, Snackbar, TextField } from '@mui/material';
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
    const MOCK_EXISTING_APIKEY = true
    const [isLoadingRemoteAPI, setIsLoadingRemoteAPI] = useState(true);
    const [APIKey, setAPIKey] = useState("");
    const [deploymentURL, setDeploymentURL] = useState(null);
    const [APIValidStatus, setAPIValidStatus] = useState("init")
    const [isShowSnackbar, setIsShowSnackbar] = useState(false)

    useEffect(() => {
        fetchRemoteAPI()
    }, [])
    const fetchRemoteAPI = async () => {
        // Simulate remote fetching, 
        var simulateAPICall = setInterval(() => {
            if (MOCK_EXISTING_APIKEY) {
                setAPIKey("4dae0c4b-3447-432d-8c8f")
                setAPIValidStatus("success")
            }
            setIsLoadingRemoteAPI(false);
            clearInterval(simulateAPICall)
        }, 1500)
    }

    const onSaveRemoteAPI = async () => {
        // Simulate remote validating, 
        setIsLoadingRemoteAPI(true);
        setDeploymentURL(null)
        var simulateAPICall = setInterval(() => {
            if (APIKey == "") {
                setAPIValidStatus("error")
            } else {
                setAPIValidStatus("success")
            }
            clearInterval(simulateAPICall)
            setIsLoadingRemoteAPI(false)
        }, 1500)

    }

    const onPostDeploy = async () => {
        setDeploymentURL("https://ploomber.io/some_random_url/" + APIKey)
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
        <Box p={3} style={{ width: 600 }}>
            <Grid container spacing={4} alignItems="center" direction="column">
                <Grid item container direction='row' alignItems="center" width={"100%"}>
                    {isLoadingRemoteAPI ? <Skeleton variant="rounded" width={"100%"} height={30} />
                        :
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
                                <Button onClick={onSaveRemoteAPI} variant="contained" size="small">SAVE</Button>
                            </Grid>
                        </Grid>

                    }


                </Grid>
                {APIValidStatus == "success" && !isLoadingRemoteAPI &&
                    <Grid item container alignItems="center" spacing={4} direction="column">

                        <Grid item justifyContent="center" xs={12}>
                            <Button onClick={onPostDeploy} variant="contained" size="small" color="primary" disabled={deploymentURL} endIcon={<CloudQueue />}>Get Deplyoment URL </Button>
                        </Grid>
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
