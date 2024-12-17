<script lang="ts">

    // import { submitExperimentResults } from '$lib/services/experimentService';

    // State management
    let participantName = '';
    let currentStage: 'intro' | 'experiment' | 'completed' = 'intro';
    let audioFiles: string[] = [];
    let currentPairIndex = 0;
    let currentPair: { file1: string, file2: string } | null = null;
    let experimentResults: Array<{ audioFile1: string, audioFile2: string, isSame: boolean }> = [];
  
    // Audio players
    let audioPlayer1: HTMLAudioElement;
    let audioPlayer2: HTMLAudioElement;
  
    // Tracking audio play state
    let player1Listened = false;
    let player2Listened = false;
    let canCompare = false;
  
    // Shuffle function
    function shuffleArray<T>(array: T[]): T[] {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
  
    // Load audio files
    async function loadAudioFiles() {
      const context = import.meta.glob('/static/audio/*.wav');
      const files = Object.keys(context).map(path => 
        path.replace('/static/audio/', '').replace('.wav', '')
      );
      return shuffleArray(files);
    }
  
    // Create audio comparison pairs
    function createAudioPairs(files: string[]) {
      const pairs = [];
      for (let i = 0; i < files.length - 1; i += 2) {
        pairs.push({ file1: files[i], file2: files[i+1] });
      }
      return shuffleArray(pairs);
    }
  
    // Start experiment
    async function startExperiment() {
      if (!participantName.trim()) {
        alert('Please enter your name');
        return;
      }

      console.log("test call to db");
      saveExperimentResultTest();

      audioFiles = await loadAudioFiles();
      const audioPairs = createAudioPairs(audioFiles);
      currentPair = audioPairs[0];
      currentStage = 'experiment';
      
      // Reset play state
      player1Listened = false;
      player2Listened = false;
      canCompare = false;
    }
  
    // Handle audio play tracking
    function handleAudioEnd(player: 1 | 2) {
      if (player === 1) {
        player1Listened = true;
      } else {
        player2Listened = true;
      }
  
      // Enable comparison if both sounds have been played
      canCompare = player1Listened && player2Listened;
    }
  
    // Handle user response
    function handleResponse(isSame: boolean) {
      if (!currentPair || !canCompare) return;
  
      experimentResults.push({
        audioFile1: currentPair.file1,
        audioFile2: currentPair.file2,
        isSame
      });
  
      // Move to next pair or complete experiment
      currentPairIndex++;
      if (currentPairIndex >= createAudioPairs(audioFiles).length) {
        // submit results when done
        submitResults();

        return;
      }
  
      // Reset for next pair
      player1Listened = false;
      player2Listened = false;
      canCompare = false;
  
      // Set up next pair
      currentPair = createAudioPairs(audioFiles)[currentPairIndex];
      audioPlayer1.src = `/audio/${currentPair.file1}.wav`;
      audioPlayer2.src = `/audio/${currentPair.file2}.wav`;
    }
    
    async function saveExperimentResultTest() {
        const response = await fetch('/api/experiment-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantName:"blah", audioComparisons: [{ audioFile1: 'name1', audioFile2: 'name2', isSame: false }] })
        });

        if (response.ok) {
        console.log('Experiment result saved:', await response.json());
        } else {
        console.error('Failed to save experiment result');
        }
    }

    // Submit results to backend
    async function submitResults() {
      try {
        const response = await fetch('/api/experiment-result', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            participantName,
            audioComparisons: experimentResults
          })
        });
  
        if (response.ok) {
          currentStage = 'completed';
        } else {
          alert('Failed to submit results');
        }
      } catch (error) {
        console.error('Submission error:', error);
        alert('Error submitting results');
      }
    }

  </script>
  
  <main class="container mx-auto p-4">
    {#if currentStage === 'intro'}
      <div class="text-center">
        <h1 class="text-2xl mb-4">Audio Comparison Experiment</h1>
        <input 
          type="text" 
          bind:value={participantName} 
          placeholder="Enter your name" 
          class="input input-bordered w-full max-w-xs mb-4"
        />
        <p class="mb-4">
          In this experiment, you will be presented with pairs of audio files. 
          You must listen to both sounds completely before deciding if they are the same or different.
        </p>
        <button 
          on:click={startExperiment} 
          class="btn btn-primary"
        >
          Begin Experiment
        </button>
      </div>
    {/if}
  
    {#if currentStage === 'experiment' && currentPair}
      <div class="text-center">
        <h2 class="text-xl mb-4">Audio Comparison</h2>
        <div class="flex justify-center space-x-4 mb-4">
          <div class="flex flex-col items-center">
            <h3 class="mb-2">Sound 1</h3>
            <audio 
              bind:this={audioPlayer1} 
              src={`/audio/${currentPair.file1}.wav`}
              on:ended={() => handleAudioEnd(1)}
            />
            <button 
              on:click={() => audioPlayer1.play()} 
              class="btn btn-secondary mt-2"
            >
              Play Sound 1
            </button>
          </div>
          
          <div class="flex flex-col items-center">
            <h3 class="mb-2">Sound 2</h3>
            <audio 
              bind:this={audioPlayer2} 
              src={`/audio/${currentPair.file2}.wav`}
              on:ended={() => handleAudioEnd(2)}
            />
            <button 
              on:click={() => audioPlayer2.play()} 
              class="btn btn-secondary mt-2"
            >
              Play Sound 2
            </button>
          </div>
        </div>
        
        <div class="mt-4">
          <h3 class="mb-2">Are these sounds the same?</h3>
          <div class="space-x-4">
            <button 
              on:click={() => handleResponse(true)} 
              disabled={!canCompare}
              class="btn btn-success {canCompare ? '' : 'btn-disabled'}"
            >
              Same
            </button>
            <button 
              on:click={() => handleResponse(false)} 
              disabled={!canCompare}
              class="btn btn-error {canCompare ? '' : 'btn-disabled'}"
            >
              Different
            </button>
          </div>
          {#if !canCompare}
            <p class="text-sm text-gray-600 mt-2">
              Please listen to both sounds completely before answering. You can listen to them as many times as you like.
            </p>
          {/if}
        </div>
      </div>
    {/if}
  
    {#if currentStage === 'completed'}
      <div class="text-center">
        <h2 class="text-2xl mb-4">Thank You!</h2>
        <p>You have completed the audio comparison experiment. Thank you very much for your time.</p>
      </div>
    {/if}
  </main>