import { redirect } from 'next/navigation';

export default function Home() {
  // Logic to check if user is logged in could go here, for now redirect to login
  redirect('/login');
}
