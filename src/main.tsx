import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
