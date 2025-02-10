import { useSearchParams } from 'next/navigation';

export default function RegistrationScreen() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    return (
        <div>{ token }</div>
    )
}