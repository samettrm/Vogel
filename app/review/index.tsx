import { Redirect } from 'expo-router';

// Tekrar Merkezi kaldirildi. Direkt erisim olursa anasayfaya yonlendir.
export default function ReviewRedirect() {
  return <Redirect href="/" />;
}
