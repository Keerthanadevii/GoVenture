import { Redirect, useLocalSearchParams } from 'expo-router';

export default function TripIndex() {
    const { id } = useLocalSearchParams();
    return <Redirect href={`/trip/${id}/blueprint`} />;
}
