<script lang="ts">
  // State management
  let participantName = '';
  let currentStage: 'intro' | 'demo' | 'experiment' | 'completed' = 'intro';
  let audioFiles: string[] = [];
  let currentPairIndex = 0;
  let currentPair: { file1: string, file2: string } | null = null;
  let currentPlayCounts = { file1: 0, file2: 0 };
  let experimentResults: Array<{
    audioFile1: string,
    audioFile2: string,
    isSame: boolean,
    playCountFile1: number,
    playCountFile2: number
  }> = [];
  let totalPairs = 0;
  let completedPairs = 0;

  // Audio players
  let audioPlayer1: HTMLAudioElement;
  let audioPlayer2: HTMLAudioElement;
  let demoPlayer1: HTMLAudioElement;
  let demoPlayer2: HTMLAudioElement;

  // Tracking audio play state
  let player1Listened = false;
  let player2Listened = false;
  let canCompare = false;
  let userResponse: boolean | null = null;
  let progressPercentage = 0;

  // Demo state
  let demoPlayer1Listened = false;
  let demoPlayer2Listened = false;
  let demoCanCompare = false;
  let demoResponse: boolean | null = null;
  let demoCompleted = false;
  let demoFiles: { file1: string, file2: string } | null = null;

  // For tracking experiment time
  let startedAt: Date

  // Reactive statement for progress
  $: {
      if (totalPairs > 0) {
          progressPercentage = Math.round((completedPairs / totalPairs) * 100);
      }
  }

  // Shuffle function
  function shuffleArray<T>(array: T[]): T[] {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
  }

  // Create pairs with reference signal, including self-pairing
  function createAudioPairs(files: string[]) {
      const referenceSignal = files[0]; // First file is reference
      const testSignals = files.slice(1); // Rest are test signals
      const pairs: Array<{ file1: string, file2: string }> = [];

      // Add self-pairing of reference signal (twice for consistency)
      pairs.push({ file1: referenceSignal, file2: referenceSignal });
      pairs.push({ file1: referenceSignal, file2: referenceSignal });

      // Create pairs with reference signal and test signals
      testSignals.forEach(testSignal => {
          // Add pair in both orders (reference-test and test-reference)
          pairs.push({ file1: referenceSignal, file2: testSignal });
          pairs.push({ file1: testSignal, file2: referenceSignal });
      });

      // Shuffle the pairs to randomize presentation order
      return shuffleArray(pairs);
  }

  // Load audio files
  async function loadAudioFiles() {
      const context = import.meta.glob('/static/audio/*.wav');
      const files = Object.keys(context).map(path => 
          path.replace('/static/audio/', '').replace('.wav', '')
      );
      return files;
  }

  // Move to demo stage and set up demo files
  async function startDemo() {
      if (!participantName.trim()) {
          alert('Please enter your name');
          return;
      }
      
      // Load and select random files for demo
      const files = await loadAudioFiles();
      const shuffled = shuffleArray(files);
      demoFiles = {
          file1: shuffled[0],
          file2: shuffled[1]
      };
      
      currentStage = 'demo';
  }

  // Handle demo audio play tracking
  function handleDemoAudioEnd(player: 1 | 2) {
      if (player === 1) demoPlayer1Listened = true;
      else demoPlayer2Listened = true;
      demoCanCompare = demoPlayer1Listened && demoPlayer2Listened;
  }

  // Handle demo response
  function submitDemoResponse(isSame: boolean) {
      demoResponse = isSame;
  }

  // Confirm demo response
  function confirmDemoResponse() {
      if (demoResponse === null) return;
      demoCompleted = true;
  }

  // Start experiment
  async function startExperiment() {
      startedAt = new Date(),
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

      // Store pairs for consistent access throughout experiment
      experimentPairs = audioPairs;
  }

  // Store all pairs to maintain consistency
  let experimentPairs: Array<{ file1: string, file2: string }> = [];

  // Handle audio play tracking
  function handleAudioEnd(player: 1 | 2) {
      if (player === 1) player1Listened = true;
      else player2Listened = true;
      canCompare = player1Listened && player2Listened;
  }

  // Handle user response submission
  function submitResponse(isSame: boolean) {
      if (!currentPair) return;
      userResponse = isSame;
  }

  // Update audio play tracking
  function handlePlay(player: 1 | 2) {
    if (player === 1) {
      currentPlayCounts.file1++;
    } else {
      currentPlayCounts.file2++;
    }
  }

  // Confirm and move to next pair
  function confirmResponse() {
    if (!currentPair || userResponse === null) return;

    experimentResults.push({
      audioFile1: currentPair.file1,
      audioFile2: currentPair.file2,
      isSame: userResponse,
      playCountFile1: currentPlayCounts.file1,
      playCountFile2: currentPlayCounts.file2
    });

    completedPairs++;
    currentPairIndex++;

    if (currentPairIndex >= experimentPairs.length) {
      submitResults();
      return;
    }

    // Reset for next pair
    player1Listened = false;
    player2Listened = false;
    canCompare = false;
    userResponse = null;
    currentPlayCounts = { file1: 0, file2: 0 };

    // Set up next pair
    currentPair = experimentPairs[currentPairIndex];
    audioPlayer1.src = `/audio/${currentPair.file1}.wav`;
    audioPlayer2.src = `/audio/${currentPair.file2}.wav`;
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
                  audioComparisons: experimentResults,
                  startedAt,
                  completedAt: new Date(),
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
          <p class="mt-4">Welcome to the audio comparison experiment. On the next page you can read the instructions and practice with a small trial page so that you will understand how the experiment will work.</p>
          <button 
              on:click={startDemo} 
              class="btn btn-primary mt-4"
          >
              Continue to Demo
          </button>
      </div>
  {/if}

  {#if currentStage === 'demo'}
      <div class="text-center">
        <h2>Experiment Information and Practice Page</h2>
        <ul>
          <li>In this experiment, you will be presented with pairs of audio files.</li>
          <li>You must listen to both sounds completely before deciding if they are the same or different.</li>
          <li>You can listen to the audio files as many times as you like and in any order.</li>
          <li>It will take around 10-15 minutes to complete. There will be a progress bar at the top so you can see how much more you have left. We do not save intermediate progress, so please complete the experiment in one sitting.</li>
          <li>There is no right or wrong answer. Please answer the question truthfully how you perceive the sounds.</li>
        </ul>
        <p class="mb-4">Below you can see how the audio files you will listen to will be presented in the experiment. Please click the buttons to listen. Once you have done this, you can decide whether they sound the same or different.</p>
          <div class="demo-container">
              <div class="audio-players">
                  <div class="audio-player">
                      <audio 
                          bind:this={demoPlayer1}
                          src={demoFiles ? `/audio/${demoFiles.file1}.wav` : ''}
                          on:ended={() => handleDemoAudioEnd(1)}
                      ></audio>
                      <button 
                          on:click={() => demoPlayer1.play()} 
                          class="btn btn-secondary"
                      >
                          Sound A
                      </button>
                  </div>
                  
                  <div class="audio-player">
                      <audio 
                          bind:this={demoPlayer2}
                          src={demoFiles ? `/audio/${demoFiles.file2}.wav` : ''}
                          on:ended={() => handleDemoAudioEnd(2)}
                      ></audio>
                      <button 
                          on:click={() => demoPlayer2.play()} 
                          class="btn btn-secondary"
                      >
                          Sound B
                      </button>
                  </div>
              </div>
              
              {#if demoCanCompare}
                  <div class="response-section">
                      <h3>Are these sounds the same?</h3>
                      <div class="button-group">
                          <button 
                              on:click={() => submitDemoResponse(true)} 
                              class="btn btn-primary {demoResponse === true ? 'btn-active' : ''}"
                          >
                              Same
                          </button>
                          <button 
                              on:click={() => submitDemoResponse(false)} 
                              class="btn btn-primary {demoResponse === false ? 'btn-active' : ''}"
                          >
                              Different
                          </button>
                      </div>

                      <button 
                          on:click={confirmDemoResponse}
                          disabled={demoResponse === null}
                          class="btn btn-success submit-btn mt-4"
                      >
                          Submit Response
                      </button>
                  </div>
              {:else}
                  <p class="mt-4">Listen to both sounds completely to compare them</p>
              {/if}

              {#if demoCompleted}
                  <div class="mt-8">
                      <h3>Great! You're ready to start the experiment.</h3>
                      <p>In the experiment on the following page, you will:</p>
                      <ul class="text-left list-disc ml-8 mb-4">
                          <li>Listen to pairs of sounds</li>
                          <li>Compare them and decide if they are the same or different</li>
                          <li>Submit your response before moving to the next pair</li>
                          <li>You can listen to each sound as many times as you need</li>
                          <li>There is no time limit, take as long as you need</li>
                      </ul>
                      <button 
                          on:click={startExperiment} 
                          class="btn btn-primary"
                      >
                          Begin Experiment
                      </button>
                  </div>
              {/if}
          </div>
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
                      on:play={() => handlePlay(1)}
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
                      on:play={() => handlePlay(2)}
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