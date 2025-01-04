import { json } from '@sveltejs/kit';
import { connectToDatabase } from '$lib/db';
import ExperimentResult from '$lib/models/ExperimentResult';

export async function POST({ request }) {
  try {
    await connectToDatabase(); // Ensure the database is connected

    const { participantName, headphoneType, audioComparisons, startedAt, completedAt } = await request.json();

    const result = await ExperimentResult.create({
      participantName,
      headphoneType,
      audioComparisons,
      startedAt,
      completedAt,
    });

    return json(result, { status: 201 }); // Respond with the created result
  } catch (error) {
    console.error('Error saving experiment result:', error);
    return json({ error: 'Error saving experiment result' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase(); // Ensure the database is connected

    const results = await ExperimentResult.find(); // Fetch all experiment results

    return json(results);
  } catch (error) {
    console.error('Error fetching experiment results:', error);
    return json({ error: 'Error fetching experiment results' }, { status: 500 });
  }
}
