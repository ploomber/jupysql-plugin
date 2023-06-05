import React, { useEffect, useState } from 'react';

import { ReactWidget } from '@jupyterlab/apputils'
import { Dialog as jupyterlabDialog } from '@jupyterlab/apputils';
import { Box, Button, Grid, Skeleton, TextField } from '@mui/material';
// import CodeBlock from 'react-copy-code';

// import { Widget } from '@lumino/widgets';
// import Dialog as muiDialog from '@mui/material/Dialog';

// Loading
// Text box 
// Initial deployment dialog


export class DeploymentDialog extends jupyterlabDialog<any> {

}


export function showDeploymentDialog() {
    const myWidget = new MainWidget();
    var deploymentDialog = new DeploymentDialog({ title: 'Deploy Notebook', body: myWidget })
    return deploymentDialog.launch()
}

const MainComponent = (): JSX.Element => {
    const [isOpenDialog, setIsOpenDialog] = useState(true);
    const [isLoadingRemoteAPI, setIsLoadingRemoteAPI] = useState(true);

    const [APIKey, setAPIKey] = useState("");
    const [hasRemoteAPI, setHasRemoteAPI] = useState(false);
    const [APIValue, setAPIValue] = useState("");
    const [deploymentURL, setDeploymentURL] = useState(null);

    useEffect(() => {
        fetchRemoteAPI()
    }, [])
    const fetchRemoteAPI = async () => {
        // Simulate remote fetching, 
        setInterval(() => {
            setIsLoadingRemoteAPI(false);
            setAPIKey("");
        }, 3000)
    }

    const onPostRemoteAPI = async () => {
        // Simulate remote validating, 
        setHasRemoteAPI(true)
        // }, 1000)
    }

    const onPostDeploy = async () => {
        setDeploymentURL("https://ploomber.io/some_random_url")
    }
    return (
        <Box p={5} style={{ minWidth: 500 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid container direction='row' alignItems="center">

                    <Grid xs={10}>
                        {isLoadingRemoteAPI ?
                            <Skeleton variant="rounded" height={30} />
                            : <div>

                                <TextField id="api-key"
                                    defaultValue={APIValue}
                                    label="API Key"
                                    variant={hasRemoteAPI ? "filled" : "outlined"}
                                    color={hasRemoteAPI ? "success" : "primary"}
                                    fullWidth={true} />
                            </div>
                        }
                    </Grid>
                    <Grid xs={2} alignItems="center">
                        <Button onClick={onPostRemoteAPI}>SAVE</Button>
                    </Grid>

                </Grid>
                <Grid container direction='row' alignItems="center" justifyContent={"center"}>

                    <Grid xs={12}>
                        <Button onClick={onPostDeploy}>Get Deplyoment URL </Button>
                    </Grid>

                    <Grid xs={12}>
                        {deploymentURL}
                    </Grid>

                </Grid>
                {/* Show ploomber URL to instruct user to generate API  */}
            </Grid>
        </Box>
    );
};

class MainWidget extends ReactWidget {
    constructor() {
        super();
    }

    render(): JSX.Element {
        return <MainComponent />;
    }
}
