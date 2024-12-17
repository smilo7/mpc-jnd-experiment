const AUDIO_FILES = [
    '/audio/paper_trombone_morph_01.wav',
    '/audio/paper_trombone_morph_02.wav',
    '/audio/paper_trombone_morph_03.wav',
    '/audio/paper_trombone_morph_04.wav',
    '/audio/paper_trombone_morph_05.wav',
    '/audio/paper_trombone_morph_06.wav',
    '/audio/paper_trombone_morph_07.wav',
    '/audio/paper_trombone_morph_08.wav',
    '/audio/paper_trombone_morph_09.wav',
    '/audio/paper_trombone_morph_10.wav',
    '/audio/paper_trombone_morph_11.wav',
    '/audio/paper_trombone_morph_12.wav',
    '/audio/paper_trombone_morph_13.wav',
    '/audio/paper_trombone_morph_14.wav',
    '/audio/paper_trombone_morph_15.wav',
    '/audio/paper_trombone_morph_16.wav',
    '/audio/paper_trombone_morph_17.wav',
    '/audio/paper_trombone_morph_18.wav',
    '/audio/paper_trombone_morph_19.wav',
    '/audio/paper_trombone_morph_20.wav',
    '/audio/paper_trombone_morph_21.wav',
    '/audio/paper_trombone_morph_22.wav',
    '/audio/paper_trombone_morph_23.wav',
    '/audio/paper_trombone_morph_24.wav',
    '/audio/paper_trombone_morph_25.wav',
    '/audio/paper_trombone_morph_26.wav',
    '/audio/paper_trombone_morph_27.wav',
    '/audio/paper_trombone_morph_28.wav',
    '/audio/paper_trombone_morph_29.wav',
    '/audio/paper_trombone_morph_30.wav'
];

const MONGODB_CONNECTION_URL = 'your_mongodb_connection_string_here';

let experimentData = {
    participantName: '',
    responses: [],
    audioSequence: []
};

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startExperiment() {
    const name = document.getElementById('participantName').value.trim();
    if (!name) {
        alert('Please enter your name');
        return;
    }

    experimentData.participantName = name;
    
    // Create a shuffled sequence of audio files
    experimentData.audioSequence = shuffleArray([...AUDIO_FILES]);

    document.getElementById('welcomeSection').style.display = 'none';
    document.getElementById('experimentSection').style.display = 'block';

    loadNextSoundPair();
}

function loadNextSoundPair() {
    const currentPairIndex = experimentData.responses.length;
    
    if (currentPairIndex >= 15) {  // Assuming 15 pairs (30 sounds total)
        finishExperiment();
        return;
    }

    const sound1 = experimentData.audioSequence[currentPairIndex * 2];
    const sound2 = experimentData.audioSequence[currentPairIndex * 2 + 1];

    document.getElementById('sound1').src = sound1;
    document.getElementById('sound2').src = sound2;
    document.getElementById('currentPair').textContent = currentPairIndex + 1;
}

function recordResponse(response) {
    const currentPairIndex = experimentData.responses.length;
    
    experimentData.responses.push({
        soundPair: [
            experimentData.audioSequence[currentPairIndex * 2],
            experimentData.audioSequence[currentPairIndex * 2 + 1]
        ],
        userResponse: response
    });

    loadNextSoundPair();
}

function finishExperiment() {
    document.getElementById('experimentSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'block';

    // Send data to backend
    fetch('/submit-experiment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(experimentData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Experiment data submitted successfully:', data);
    })
    .catch(error => {
        console.error('Error submitting experiment data:', error);
    });
}