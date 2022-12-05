import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import {
    fileToString,
    checkFileExtension,
    mapHeadersToRows,
    getCsvRows,
    getCsvHeaders,
} from '../utils';

const REQUIRED_NUM_OF_HEADERS = 8;
const REQUIRED_HEADERS = [
    'date',
    'category',
    'lot title',
    'lot location',
    'lot condition',
    'pre-tax amount',
];
const SUCCESS_RESPONSE_CODE = 200;

function Home() {
    // State for maintaining error
    const [error, setError] = useState('');
    const [csvData, setCsvData] = useState([]);

    /* ******Navigation hooks ******** */
    const navigate = useNavigate();
    /* *******Data Context ************* */
    const { uploadData } = useData();

    // The function uploads the data to backend if the data passes validity checks
    const handleFormSubmit = async (e) => {
        // Set uploaded state to be false
        e.preventDefault();

        if (!e.target.checkValidity()) {
            e.stopPropagation();
            return;
        }

        let jsonConverted;
        try {
            jsonConverted = JSON.stringify(csvData);
        } catch (err) {
            setError('Error in Serializing!');
            return;
        }

        const responseCode = await uploadData(jsonConverted);
        if (responseCode !== SUCCESS_RESPONSE_CODE) {
            setError('Error in uploading!');
            return;
        }

        // If upload was successful, navigate to analytics page
        navigate('/show');
    };

    // This function is basically a wrapper that makes all the validation checks
    // If all validity checks pass, the state for csvData is valid and is set at end.
    const handleFileValidity = async (e) => {
        // Initialize csvData state
        setCsvData([]);
        // Add was validated class to parent form,so that UI starts displaying feedback
        e.target.parentElement.classList.add('was-validated');

        // Check if file extension is csv or not
        if (!checkFileExtension(e.target.files[0].name, /\.(csv)$/i)) {
            // Set error message inside textContent of error
            setError('Not a csv file');
            // Set validity of this element to false so that form becomes invalid
            e.target.setCustomValidity('Error');

            return;
        }

        // Check if file is empty or not
        const csvString = await fileToString(e.target.files[0]);
        if (csvString === '') {
            // Set error message inside textContent of error
            setError('Empty file');
            // Set validity of this element to false so that form becomes invalid
            e.target.setCustomValidity('Error');

            return;
        }

        let csvHeaders = getCsvHeaders(csvString);
        // Data is invalid, if minimum headers are not present
        if (csvHeaders.length < REQUIRED_NUM_OF_HEADERS) {
            setError('Minimum headers not present');
            // Set validity of this element to false so that form becomes invalid
            e.target.setCustomValidity('Error');
            return;
        }
        // if csv headers dont have a name, give them names explicitly
        if (csvHeaders[0] === '') {
            csvHeaders = [
                'date',
                'category',
                'lot title',
                'lot location',
                'lot condition',
                'pre-tax amount',
                'tax name',
                'tax amount',
            ];
        }

        const csvRows = getCsvRows(csvString);
        // Data is invalid, if no rows are present
        if (csvRows.length < 1) {
            setError('Empty Rows');
            // Set validity of this element to false so that form becomes invalid
            e.target.setCustomValidity('Error');
            return;
        }
        // Check if all rows can be mapped to headers and a csvArray can be obtained
        const csvArray = mapHeadersToRows(
            csvHeaders,
            csvRows,
            REQUIRED_HEADERS
        );
        if (csvArray.length === 0) {
            // If there is an error in CSV data
            setError('Required field are not present');
            // Set validity of this element to false so that form becomes invalid
            e.target.setCustomValidity('Error');
            return;
        }

        // If everything is good set custom validity to empty which makes this field validated
        e.target.setCustomValidity('');
        // Set state of data, so that it can be uploaded
        setCsvData(csvArray);
    };
    return (
        <div className="bg-light text-dark p-5 text-center">
            <form
                className="needs-validation"
                id="uploadForm"
                noValidate
                onSubmit={handleFormSubmit}
            >
                <input
                    className="form-control mx-auto form-fileInput"
                    type="file"
                    onChange={handleFileValidity}
                    required
                />
                <div className="invalid-feedback">{error}</div>

                <button type="submit" className="btn btn-primary my-3">
                    Upload
                </button>
            </form>
        </div>
    );
}

export default Home;
