<script lang="ts">
  // State management
  let participantName = '';
  let currentStage: 'intro' | 'experiment' | 'completed' = 'intro';
  let audioFiles: string[] = [];
  let currentPairIndex = 0;
  let currentPair: { file1: string, file2: string } | null = null;
  let experimentResults: Array<{ audioFile1: string, audioFile2: string, isSame: boolean }> = [];
  let totalPairs = 0;
  let completedPairs = 0;

  // Audio players
  let audioPlayer1: HTMLAudioElement;
  let audioPlayer2: HTMLAudioElement;

  // Tracking audio play state
  let player1Listened = false;
  let player2Listened = false;
  let canCompare = false;
  let userResponse: boolean | null = null;
  let progressPercentage = 0;

  // Reactive statement for progress
  $: {
      if (totalPairs > 0) {
          progressPercentage = Math.round((completedPairs / totalPairs) * 100);
      }
  }

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
    //   console.log("test case")
    //   submitResultsTest(); // test db write

      audioFiles = await loadAudioFiles();
      const audioPairs = createAudioPairs(audioFiles);
      totalPairs = audioPairs.length;
      currentPair = audioPairs[0];
      currentStage = 'experiment';
      
      // Reset play state
      player1Listened = false;
      player2Listened = false;
      canCompare = false;
      userResponse = null;
      completedPairs = 0;
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

  // Handle user response submission
  function submitResponse(isSame: boolean) {
      if (!currentPair) return;

      userResponse = isSame;
  }

  // Confirm and move to next pair
  function confirmResponse() {
      if (!currentPair || userResponse === null) return;
  
      experimentResults.push({
          audioFile1: currentPair.file1,
          audioFile2: currentPair.file2,
          isSame: userResponse
      });
  
      // Move to next pair or complete experiment
      currentPairIndex++;
      completedPairs++;

      if (currentPairIndex >= createAudioPairs(audioFiles).length) {
          // submit results when done
          submitResults();
          return;
      }
  
      // Reset for next pair
      player1Listened = false;
      player2Listened = false;
      canCompare = false;
      userResponse = null;
  
      // Set up next pair
      currentPair = createAudioPairs(audioFiles)[currentPairIndex];
      audioPlayer1.src = `/audio/${currentPair.file1}.wav`;
      audioPlayer2.src = `/audio/${currentPair.file2}.wav`;

      console.log(currentPairIndex, completedPairs);
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

//   async function submitResultsTest() {
//       const testName = "TestParticipant"
//       try {
//           const response = await fetch('/api/experiment-result', {
//               method: 'POST',
//               headers: {
//                   'Content-Type': 'application/json'
//               },
//               body: JSON.stringify({
//                   participantName: testName,
//                   audioComparisons: experimentResults
//               })
//           });
  
//           if (response.ok) {
//               currentStage = 'completed';
//           } else {
//               alert('Failed to submit results');
//           }
//       } catch (error) {
//           console.error('Submission error:', error);
//           alert('Error submitting results');
//       }
//   }
</script>

<main class="container">
  {#if currentStage === 'intro'}
      <div class="text-center">
          <h1>Audio Comparison Experiment</h1>
          <input 
              type="text" 
              class="input"
              bind:value={participantName} 
              placeholder="Enter your name" 
          >
          <ul>
            <li>In this experiment, you will be presented with pairs of audio files.</li>
            <li>You must listen to both sounds completely before deciding if they are the same or different.</li>
            <li>You can listen to the audio files as many times as you like.</li>
            <li>It will take around 5 minutes to complete.</li>
          </ul>
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
          <h2>Audio Comparison</h2>
          
          <div class="progress-container">
              <div 
                  class="progress-bar" 
                  style="width: {progressPercentage}%"
              ></div>
          </div>

          <div class="audio-players">
              <div class="audio-player">
                  <audio 
                      bind:this={audioPlayer1} 
                      src={`/audio/${currentPair.file1}.wav`}
                      on:ended={() => handleAudioEnd(1)}
                  ></audio>
                  <button 
                      on:click={() => audioPlayer1.play()} 
                      class="btn btn-secondary"
                  >
                      Sound A
                  </button>
              </div>
              
              <div class="audio-player">
                  <audio 
                      bind:this={audioPlayer2} 
                      src={`/audio/${currentPair.file2}.wav`}
                      on:ended={() => handleAudioEnd(2)}
                  ></audio>
                  <button 
                      on:click={() => audioPlayer2.play()} 
                      class="btn btn-secondary"
                  >
                      Sound B
                  </button>
              </div>
          </div>
          
          {#if canCompare}
              <div class="response-section">
                  <h3>Are these sounds the same?</h3>
                  <div class="button-group">
                      <button 
                          on:click={() => submitResponse(true)} 
                          class="btn btn-primary {userResponse === true ? 'btn-active' : ''}"
                      >
                          Same
                      </button>
                      <button 
                          on:click={() => submitResponse(false)} 
                          class="btn btn-primary {userResponse === false ? 'btn-active' : ''}"
                      >
                          Different
                      </button>
                  </div>

                  <button 
                      on:click={confirmResponse}
                      disabled={userResponse === null}
                      class="btn btn-success submit-btn"
                  >
                      Submit Response
                  </button>
              </div>
          {/if}
      </div>
  {/if}

  {#if currentStage === 'completed'}
      <div class="text-center">
          <h2>Thank You!</h2>
          <p>
              You have completed the audio comparison experiment. 
              Thank you very much for your time.
          </p>
      </div>
  {/if}
</main>

<style>
  .btn-active {
      opacity: 0.7;
      pointer-events: none;
  }
</style>