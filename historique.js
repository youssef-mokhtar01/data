import React, { useState, useEffect, useRef } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import 'chart.js/auto';
import { Pie } from 'react-chartjs-2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import MDBox from "components/MDBox";


import Plot from 'react-plotly.js';



    


const CercleDeRapportPage = () => {
    const [inputValue, setInputValue] = useState('');
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState(null);
    const [percentages, setPercentages] = useState(null); 
    const [featureSummary, setFeatureSummary] = useState(null);
    const [showCircles, setShowCircles] = useState(false);
    const pieChartRef = useRef(null); 
    const [fileList, setFileList] = useState([]); // State pour stocker la liste des fichiers
    const [selectedFile, setSelectedFile] = useState(''); // State pour stocker le fichier sélectionné
    useEffect(() => {
        // Effectuez une requête pour récupérer la liste des 10 derniers fichiers stockés
        fetch('http://localhost:3008/lastfiles')
            .then(response => response.json())
            .then(data => setFileList(data))
            .catch(error => console.error('Error fetching last files:', error));
    }, []); // Assurez-vous que cette requête est effectuée une seule fois lorsque le composant est monté

    const handleFileSelect = (event) => {
        setSelectedFile(event.target.value); // Mettre à jour le fichier sélectionné
    };

    const handleFetchData = async () => {
        try {
            const response = await fetch('http://localhost:3008/summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nom_fichier: selectedFile }) // Utilisation du fichier sélectionné
            });
            const data = await response.json();
            if (response.ok) {
                if (data.summary) {
                    setSummary(data.summary);
                    setError(null);
                    setPercentages(data.percentages);
                    setShowCircles(true);
                } else {
                    window.alert("Ce rapport n'existe pas dans la base");
                    setSummary(null);
                    setPercentages(null);
                    setFeatureSummary(null);
                    setShowCircles(false);
                }
                if (data.featureSummary) {
                    setFeatureSummary(data.featureSummary);
                }
            } else {
                setError(data.error);
                setSummary(null);
                setPercentages(null);
                setFeatureSummary(null);
                setShowCircles(false);
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Internal server error');
            setSummary(null);
            setPercentages(null);
            setFeatureSummary(null);
            setShowCircles(false);
            window.alert('Erreur interne du serveur');
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!selectedFile) {
            const alertDiv = document.createElement('div');
            alertDiv.setAttribute('style', 'position: fixed; top: 11%; left: 50%; transform: translate(-50%, -50%); padding: 20px; background-color: rgb(255, 255, 255); color: rgb(0, 0, 0); border-radius: 5px; z-index: 9999; font-family: italic;');
            alertDiv.innerHTML = `
                Please select a file
                <button style="width: 20%; background-color: black; color: white; font-family: italic; border-color: #1de9b6; margin-left: 75%;" onclick="this.parentNode.remove()">OK</button>
            `;
            document.body.appendChild(alertDiv);
        } else {
            handleFetchData();
        }
    };
    

    const getTotalFeatureCount = (featureSummary) => {
        let totalFeatures = 0;
        if (featureSummary && featureSummary.length > 0) {
            featureSummary.forEach((feature) => {
                totalFeatures += parseInt(feature.total_passed) + parseInt(feature.total_failed);
            });
        }
        return totalFeatures;
    };

    useEffect(() => {
        if (pieChartRef && pieChartRef.current) {
            const chartInstance = pieChartRef.current.chartInstance;
            if (chartInstance) {
                chartInstance.options.plugins.tooltip.callbacks.label = function (tooltipItem, data) {
                    const dataset = data.datasets[tooltipItem.datasetIndex];
                    const total = dataset.data.reduce((acc, value) => acc + value, 0);
                    const currentValue = dataset.data[tooltipItem.index];
                    const percentage = parseFloat(((currentValue / total) * 100).toFixed(2));
                    return `${data.labels[tooltipItem.index]}: ${currentValue} (${percentage}%)`;
                };
                chartInstance.update();
            }
        }
    }, [summary]);

    const data = {
        labels: ['Passed', 'Failed', 'Skipped', 'Pending'],
        datasets: [
            {
                data: [
                    summary?.total_passed?? 0,
                    summary?.total_failed?? 0,
                    summary?.total_skipped?? 0,
                    summary?.total_pending?? 0,
                  ],
                backgroundColor: ['#08c999', '#ff0000', '#3598db', '#f4f400'],
                hoverBackgroundColor: ['#08c999', '#ff0000', '#3598db', '#f4f400'],
            },
        ],
    };

    const calculatePercentage = (passed, failed, total) => {
        const passedPercentage = (passed * 100) / total;
        const failedPercentage = (failed * 100) / total;
        return [passedPercentage.toFixed(2), failedPercentage.toFixed(2)];
    };

    let featureData = {};
    let featurePercentage = [];
    if (featureSummary && featureSummary.length > 0) {
        featureData = {
            labels: ['Passed', 'Failed'],
            datasets: [
                {
                    data: [
                        parseInt(featureSummary[0].total_passed),
                        parseInt(featureSummary[0].total_failed)
                    ],
                    backgroundColor: ['#08c999', '#ff0000'],
                    hoverBackgroundColor: ['#08c999', '#ff0000'],
                },
            ],
        };
        featurePercentage = calculatePercentage(
            parseInt(featureSummary[0].total_passed),
            parseInt(featureSummary[0].total_failed),
            getTotalFeatureCount(featureSummary)
        );
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
      
        return `${year}-${month}-${day}`;
    };
    /*histogram*/ 
    
    
      const histogram = {
        x: [
            percentages?.passed?? 0,
            percentages?.failed?? 0,
            percentages?.skipped?? 0,
            percentages?.pending?? 0,
          ],
        type: 'histogram',
        marker: {
          color: ['#08c999', '#ff0000', '#3598db', '#f4f400'],
        },
        nbinsx: 4, // number of bins on the x-axis
      };
    
      const layout = {
        title: 'Test Results',
        xaxis: { title: 'Test Result' },
        yaxis: { title: 'Number of Tests' },
        bargap: 0.1,
      };

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <Card style={{ borderColor: 'aqua', borderWidth: '1px', width: '1000px', height: '500px', marginTop: '1%', left: '-1%' }}>
                <CardContent style={{ borderColor: 'aqua', borderWidth: '1px' }}>
                    <Typography variant="h6" component="div"></Typography>
                    <form onSubmit={handleSubmit}>
                        <div style={{ position: 'relative', width: "40%", marginTop: '2%',marginLeft:'30px' }}>
                        <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '10px',fontSize:'18px',fontFamily:'italic', color: selectedFile ? 'transparent' : 'rgba(0, 0, 0, 0.54)' }}>Choose File Name</div>
                        <Select
                            value={selectedFile}
                            onChange={handleFileSelect}
                            variant="outlined"
                            style={{ width: "100%" }}
                        >
                        
                            {fileList.map(file => (
                                <MenuItem key={file} value={file}>{file}</MenuItem>
                            ))}
                        </Select>
                        </div>
                        <br/>
                            <Button type="submit" variant="contained" style={{ color: 'white', backgroundColor: 'rgb(14, 216, 184)', borderColor: 'black',marginTop:'-6%',marginLeft:'30px'  }}>
                            Display
                            </Button>
                    </form>

                    {error && <Typography variant="body1" color="error">{error}</Typography>}
                    {showCircles && summary && percentages && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'start', width: '100%' }}>
                            <Card style={{ backgroundColor: 'rgb(249, 249, 249)', width: '300px', top: '-9px', borderColor: '', marginRight: '10px' }}>
                                <CardContent style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontSize: '6.5px', fontFamily: 'Arial', height: '360px' }}>
                                    <Typography variant="body1" style={{ fontSize: '350%', fontFamily: 'Italic', color: 'rgb(107, 103, 103)' }}>Run info</Typography>
                                    <hr style={{ width: '100%', margin: '7px 0' }} />
                                    <div>
                                        <Typography variant="body1" style={{ fontSize: '200%', fontFamily: 'Arial', color: 'rgb(119, 119, 119)' }}><b style={{ color: 'rgb(107, 103, 103)' }}>Project</b></Typography>
                                        <Typography variant="body1" style={{ fontSize: '200%', fontFamily: 'Arial', color: 'rgb(150, 142, 142)' }}>DATAHUB visage</Typography>
                                        <Typography variant="body1" style={{ fontSize: '200%', fontFamily: 'Arial', color: 'rgb(119, 119, 119)' }}><b style={{ color: 'rgb(107, 103, 103)' }}>Suite</b></Typography>
                                        <Typography variant="body1" style={{ fontSize: '200%', fontFamily: 'Arial', color: 'rgb(150, 142, 142)' }}>{summary.tag}</Typography>
                                        <Typography variant="body1" style={{ fontSize: '200%', fontFamily: 'Arial', color: 'rgb(119, 119, 119)' }}><b style={{ color: 'rgb(107, 103, 103)' }}>Execution Date</b></Typography>
                                        <Typography variant="body1" style={{ fontSize: '200%', fontFamily: 'Arial', color: 'rgb(150, 142, 142)' }}>{formatDate(summary.first_textdate)}</Typography>
                                        <Typography variant="body1" style={{ fontSize: '200%', fontFamily: 'Arial', color: 'rgb(119, 119, 119)' }}><b style={{ color: 'rgb(107, 103, 103)' }}>Environnement DATAHUB</b></Typography>

                                        {summary && summary.first_type && (<Typography variant="body1" style={{ fontSize: '200%', fontFamily: 'Arial', color: 'rgb(150, 142, 142)' }}>{summary.first_type}</Typography>)}

                                        <Typography variant="body1" style={{ fontSize: '200%', fontFamily: 'Arial', color: 'rgb(119, 119, 119)' }}><b style={{ color: 'rgb(107, 103, 103)' }}>Build_Hash</b></Typography>
                                        <Typography variant="body1" style={{ fontSize: '200%', fontFamily: 'Arial', color: 'rgb(150, 142, 142)' }}>{summary.build_hash}</Typography>

                                        <Typography variant="body1" style={{ fontSize: '200%', fontFamily: 'Arial', color: 'rgb(119, 119, 119)' }}><b style={{ color: 'rgb(107, 103, 103)' }}>Scénarios</b></Typography>
                                        <Typography variant="body1" style={{ fontSize: '200%', fontFamily: 'Arial', color: 'rgb(150, 142, 142)' }}>{summary.total_testname}</Typography>

                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                                        <div style={{ marginRight: '50%' }}>
                                            <Typography variant="body1" style={{ fontSize: '200%', fontFamily: 'Arial', color: 'rgb(119, 119, 119)' }}>
                                            <b style={{ color: 'rgb(107, 103, 103)' }}>Tests</b>
                                            </Typography>
                                            <Typography variant="body1" style={{ fontSize: '200%', fontFamily: 'Arial', color: 'rgb(150, 142, 142)' }}>
                                            {summary.total_steps}
                                            </Typography>
                                        </div>
                                        <div>
                                            <Typography variant="body1" style={{ fontSize: '200%', fontFamily: 'Arial', color: 'rgb(119, 119, 119)' }}>
                                            <b style={{ color: 'rgb(107, 103, 103)' }}>Feature</b>
                                            </Typography>
                                            <Typography variant="body1" style={{ fontSize: '200%', fontFamily: 'Arial', color: 'rgb(150, 142, 142)' }}>
                                            {getTotalFeatureCount(featureSummary)}
                                            </Typography>
                                        </div>

                                    </div>

                                </CardContent>
                            </Card>
                            <Card style={{ backgroundColor: 'rgb(249, 249, 249)', width: '300px', top: '-9px', marginRight: '10px' }}>
                                <CardContent style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '7px', fontFamily: 'Arial', height: '360px' }}>
                                    <Typography variant="body1" style={{ fontSize: '350%', fontFamily: 'Italic', color: 'rgb(107, 103, 103)' ,marginLeft:'-80%'}}>Tests</Typography>
                                    <hr style={{ width: '100%', margin: '5px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
                                        <Pie ref={pieChartRef} data={data} />
                                    </div>

                                    <div>
                                        {/*Histogram*/}
                                         <div style={{marginTop:"25%"}}>
                                            <h1 style={{fontSize:'50px'}}>Histogram</h1>
                                        </div>                               
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%',marginTop:'-200px'}}>
                                            <Typography variant="body1" style={{ fontSize: '14px' }}></Typography>
                                            <Plot data={[histogram]} layout={layout} />
                                        </div>
                                        {/*Histogram */}
                                        <br/>
                                        <div style={{  justifyContent: 'pace-between', alignItems: 'center', backgroundColor: 'red' }}>
                                            <div style={{ width: '40%' }}>
                                                <Typography variant="body1" style={{ fontSize: '14px' }}>Overview</Typography>
                                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                                <CheckCircleIcon style={{ color: '#08c999', marginRight: '1px', fontSize: '30px',height:'25%',width:'25%'}} />
                                                <Typography variant="body1" style={{ fontSize: '14px' }}>{percentages.passed}%</Typography>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                                <CancelIcon style={{ color: '#ff0000', marginRight: '1px', fontSize: '30px',height:'25%',width:'25%'}} />
                                                <Typography variant="body1" style={{ fontSize: '14px' }}>{percentages.failed}%</Typography>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                                <NotInterestedIcon style={{ color: '#3598db', marginRight: '1px', fontSize: '30px',height:'25%',width:'25%' }} />
                                                <Typography variant="body1" style={{ fontSize: '14px' }}>{percentages.skipped}%</Typography>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                                <HourglassEmptyIcon style={{ color: '#f4f400', marginRight: '1px', fontSize: '30px',height:'25%',width:'25%'}} />
                                                <Typography variant="body1" style={{ fontSize: '14px' }}>{percentages.pending}%</Typography>
                                                </div>
                                            </div>
                                        </div>
                                    </div>


                                </CardContent>
                            </Card>
                            <Card style={{ backgroundColor: 'rgb(249, 249, 249)', width: '300px', top: '-9px', marginRight: '-20px' }}>
                                <CardContent style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '14px', fontFamily: 'Arial', height: '360px' }}>
                                    <Typography variant="body1" style={{ fontSize: '24px', fontFamily: 'Italic', color: 'rgb(107, 103, 103)', marginLeft: '-69%' }}>Features</Typography>
                                    <hr style={{ width: '100%', margin: '5px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '90%',marginTop:'16px' }}>
                                        <Pie data={featureData} />
                                    </div>

                                    {featurePercentage.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
                                                <CheckCircleIcon style={{ color: '#08c999', marginRight: '5px', fontSize: '14px' ,marginTop:'20px'}} />
                                                <Typography variant="body1" style={{ fontSize: '14px' ,marginTop:'20px'}}>{featurePercentage[0]}%</Typography>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <CancelIcon style={{ color: '#ff0000', marginRight: '5px', fontSize: '14px' ,marginTop:'20px'}} />
                                                <Typography variant="body1" style={{ fontSize: '14px',marginTop:'20px' }}>{featurePercentage[1]}%</Typography>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default CercleDeRapportPage;
