import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

// ============================================================================
// FIREBASE CONFIG - Your QWS Nestboxes Project
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyC1Xb1v-_nKoUt9smrgXnERatEozjUHhlY",
  authDomain: "qws-nestboxes.firebaseapp.com",
  projectId: "qws-nestboxes",
  storageBucket: "qws-nestboxes.firebasestorage.app",
  messagingSenderId: "653005461987",
  appId: "1:653005461987:web:1779dff25fb5ddce2a8d6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================================================
// CONSTANTS
// ============================================================================
const BRAND = { olive: '#5C6B4A', black: '#0A0A0A', blackLight: '#1A1A1A', cream: '#F5F3EF', creamMuted: '#A8A29C' };
const STATUS_COLORS = { red: '#dc3545', green: '#28a745', blue: '#4a90d9', orange: '#fd7e14' };

const SPECIES_OPTIONS = ['Empty', 'Carolina Chickadee', 'Carolina Wren', 'Tree Swallow', 'Eastern Bluebird', 'House Wren', 'Other/Unknown'];
const CONTENTS_OPTIONS = ['Empty', 'Original Pine Straw', 'Active Nest (no eggs yet)', 'Eggs', 'Chicks Only', 'Eggs + Chicks', 'Fledged', 'Abandoned', 'Wasps / Hornets', 'Other'];
const CONDITION_OPTIONS = ['Good', 'Needs Attention', 'Needs Maintenance', 'Needs Spraying', 'Needs Replacement'];
const SECTIONS = [{ id: 'NM', name: 'North Meadow' }, { id: 'TV', name: 'Tweetsville' }, { id: 'BW', name: 'Bird Watch' }, { id: 'PM', name: 'Pavilion Meadow' }, { id: 'SM', name: 'South Meadow' }, { id: 'MT', name: 'Matthews Trail' }, { id: 'AT', name: 'Azalea Trail' }];
const CENTER = [34.7104, -86.6308];

const getStatusColor = (contents, condition) => {
  if (condition === 'Needs Attention') return STATUS_COLORS.red;
  if (['Active Nest (no eggs yet)', 'Eggs', 'Chicks Only', 'Eggs + Chicks'].includes(contents)) return STATUS_COLORS.green;
  if (['Needs Maintenance', 'Needs Spraying', 'Needs Replacement'].includes(condition) || contents === 'Wasps / Hornets') return STATUS_COLORS.orange;
  return STATUS_COLORS.blue;
};
const getStatusLabel = (contents, condition) => {
  if (condition === 'Needs Attention') return 'Urgent';
  if (['Active Nest (no eggs yet)', 'Eggs', 'Chicks Only', 'Eggs + Chicks'].includes(contents)) return 'Active';
  if (['Needs Maintenance', 'Needs Spraying', 'Needs Replacement'].includes(condition) || contents === 'Wasps / Hornets') return 'Maintenance';
  return 'Ready';
};

// Initial box data (will be seeded to Firestore on first run)
const INITIAL_BOXES = [
  { id: '1NM', section: 'NM', contents: 'Original Pine Straw', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '2NM', section: 'NM', contents: 'Chicks Only', condition: 'Good', species: 'Tree Swallow', notes: 'At least two hatchlings!!!!!', eggs: 0, chicks: 2 },
  { id: '3NM', section: 'NM', contents: 'Original Pine Straw', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '4NM', section: 'NM', contents: 'Empty', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '5NM', section: 'NM', contents: 'Eggs', condition: 'Good', species: 'Tree Swallow', notes: '', eggs: 2, chicks: 0 },
  { id: '6NM', section: 'NM', contents: 'Empty', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '7NM', section: 'NM', contents: 'Empty', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '8NM', section: 'NM', contents: 'Empty', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '9NM', section: 'NM', contents: 'Empty', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '10NM', section: 'NM', contents: 'Empty', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '11NM', section: 'NM', contents: 'Empty', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '12TV', section: 'TV', contents: 'Active Nest (no eggs yet)', condition: 'Good', species: 'Tree Swallow', notes: 'Grass and feather nest', eggs: 0, chicks: 0 },
  { id: '13TV', section: 'TV', contents: 'Original Pine Straw', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '14TV', section: 'TV', contents: 'Original Pine Straw', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '15TV', section: 'TV', contents: 'Empty', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '16TV', section: 'TV', contents: 'Original Pine Straw', condition: 'Good', species: 'Other/Unknown', notes: '', eggs: 0, chicks: 0 },
  { id: '17BW', section: 'BW', contents: 'Active Nest (no eggs yet)', condition: 'Good', species: 'Other/Unknown', notes: 'Huge grass nest', eggs: 0, chicks: 0 },
  { id: '18BW', section: 'BW', contents: 'Original Pine Straw', condition: 'Good', species: 'Other/Unknown', notes: 'Grass nest', eggs: 0, chicks: 0 },
  { id: '19BW', section: 'BW', contents: 'Original Pine Straw', condition: 'Needs Spraying', species: 'Tree Swallow', notes: 'Dead tree swallow covered in ants', eggs: 0, chicks: 0 },
  { id: '20BW', section: 'BW', contents: 'Original Pine Straw', condition: 'Good', species: 'Empty', notes: 'Stick nest', eggs: 0, chicks: 0 },
  { id: '21BW', section: 'BW', contents: 'Active Nest (no eggs yet)', condition: 'Good', species: 'Empty', notes: 'Stick and grass nest', eggs: 0, chicks: 0 },
  { id: '22BW', section: 'BW', contents: 'Empty', condition: 'Needs Maintenance', species: 'Empty', notes: 'Needs new house and baffle', eggs: 0, chicks: 0 },
  { id: '23BW', section: 'BW', contents: 'Empty', condition: 'Needs Maintenance', species: 'Empty', notes: 'NEEDS GPS', eggs: 0, chicks: 0 },
  { id: '24BW', section: 'BW', contents: 'Empty', condition: 'Needs Maintenance', species: 'Empty', notes: 'Needs new house, baffle', eggs: 0, chicks: 0 },
  { id: '25BW', section: 'BW', contents: 'Active Nest (no eggs yet)', condition: 'Good', species: 'Empty', notes: 'Grass and feather nest', eggs: 0, chicks: 0 },
  { id: '26BW', section: 'BW', contents: 'Empty', condition: 'Good', species: 'Empty', notes: 'Dead chickadee on nest', eggs: 0, chicks: 0 },
  { id: '27PM', section: 'PM', contents: 'Original Pine Straw', condition: 'Good', species: 'Other/Unknown', notes: 'Stick nest', eggs: 0, chicks: 0 },
  { id: '28PM', section: 'PM', contents: 'Eggs', condition: 'Good', species: 'Other/Unknown', notes: 'Sticks, trash, feathers', eggs: 6, chicks: 0 },
  { id: '29PM', section: 'PM', contents: 'Original Pine Straw', condition: 'Good', species: 'Other/Unknown', notes: 'Stick nest on grass nest', eggs: 0, chicks: 0 },
  { id: '30SM', section: 'SM', contents: 'Empty', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '31SM', section: 'SM', contents: 'Original Pine Straw', condition: 'Good', species: 'Empty', notes: 'Lichen and grass', eggs: 0, chicks: 0 },
  { id: '32SM', section: 'SM', contents: 'Original Pine Straw', condition: 'Good', species: 'Empty', notes: 'Start of moss nest', eggs: 0, chicks: 0 },
  { id: '33SM', section: 'SM', contents: 'Original Pine Straw', condition: 'Good', species: 'Empty', notes: 'Stick nest', eggs: 0, chicks: 0 },
  { id: '34SM', section: 'SM', contents: 'Original Pine Straw', condition: 'Good', species: 'Other/Unknown', notes: 'Huge grass and leaf nest', eggs: 0, chicks: 0 },
  { id: '35SM', section: 'SM', contents: 'Original Pine Straw', condition: 'Good', species: 'Other/Unknown', notes: 'Pine straw, stick, feather nest', eggs: 0, chicks: 0 },
  { id: '36SM', section: 'SM', contents: 'Fledged', condition: 'Good', species: 'Other/Unknown', notes: 'Chicks fledged!', eggs: 0, chicks: 0 },
  { id: '37SM', section: 'SM', contents: 'Original Pine Straw', condition: 'Good', species: 'Empty', notes: 'Grass nest', eggs: 0, chicks: 0 },
  { id: '38SM', section: 'SM', contents: 'Empty', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '39SM', section: 'SM', contents: 'Empty', condition: 'Good', species: 'Empty', notes: 'Wasp removed', eggs: 0, chicks: 0 },
  { id: '40MT', section: 'MT', contents: 'Empty', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '41MT', section: 'MT', contents: 'Original Pine Straw', condition: 'Good', species: 'Other/Unknown', notes: 'Moss, grass, fur', eggs: 0, chicks: 0 },
  { id: '42MT', section: 'MT', contents: 'Fledged', condition: 'Good', species: 'Carolina Chickadee', notes: 'Babies fledged!', eggs: 0, chicks: 3 },
  { id: '43AT', section: 'AT', contents: 'Abandoned', condition: 'Good', species: 'Other/Unknown', notes: '2 dead chicks', eggs: 0, chicks: 2 },
  { id: '44AT', section: 'AT', contents: 'Empty', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '45AT', section: 'AT', contents: 'Empty', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '46AT', section: 'AT', contents: 'Empty', condition: 'Good', species: 'Empty', notes: '', eggs: 0, chicks: 0 },
  { id: '47AT', section: 'AT', contents: 'Original Pine Straw', condition: 'Good', species: 'Other/Unknown', notes: 'Moss and grass nest', eggs: 0, chicks: 0 }
];

const INITIAL_CHECKS = [
  { boxId: '1NM', timestamp: '2025-12-15T10:00:00Z', species: 'Empty', contents: 'Wasps / Hornets', eggs: 0, chicks: 0, condition: 'Needs Attention', checkedBy: 'Initial Survey 2025', notes: 'Wasp nest' },
  { boxId: '2NM', timestamp: '2025-12-15T10:05:00Z', species: 'Other/Unknown', contents: 'Active Nest (no eggs yet)', eggs: 0, chicks: 0, condition: 'Good', checkedBy: 'Initial Survey 2025', notes: 'Feathers present' },
  { boxId: '42MT', timestamp: '2025-12-15T13:00:00Z', species: 'Carolina Chickadee', contents: 'Active Nest (no eggs yet)', eggs: 0, chicks: 0, condition: 'Good', checkedBy: 'Initial Survey 2025', notes: 'Moss nest with chickadee' },
  { boxId: '43AT', timestamp: '2025-12-15T13:05:00Z', species: 'Carolina Chickadee', contents: 'Eggs', eggs: 0, chicks: 0, condition: 'Good', checkedBy: 'Initial Survey 2025', notes: 'Chickadee on eggs' },
  { boxId: '29PM', timestamp: '2026-04-20T10:10:00Z', species: 'Other/Unknown', contents: 'Eggs', eggs: 5, chicks: 0, condition: 'Good', checkedBy: 'Haley and Alexis', notes: 'Soaped' },
  { boxId: '36SM', timestamp: '2026-04-20T10:45:00Z', species: 'Other/Unknown', contents: 'Eggs', eggs: 4, chicks: 0, condition: 'Good', checkedBy: 'Haley and Alexis', notes: 'Spider nest, soaped' },
  { boxId: '42MT', timestamp: '2026-04-20T11:30:00Z', species: 'Carolina Chickadee', contents: 'Chicks Only', eggs: 0, chicks: 3, condition: 'Good', checkedBy: 'Haley and Alexis', notes: '2-3 chicks' },
  { boxId: '43AT', timestamp: '2026-04-20T11:35:00Z', species: 'Carolina Chickadee', contents: 'Chicks Only', eggs: 0, chicks: 5, condition: 'Good', checkedBy: 'Haley and Alexis', notes: 'Five nestlings' },
  { boxId: '2NM', timestamp: '2026-05-14T09:05:00Z', species: 'Tree Swallow', contents: 'Chicks Only', eggs: 0, chicks: 2, condition: 'Good', checkedBy: 'Alexis', notes: 'At least two hatchlings!!!!!' },
  { boxId: '5NM', timestamp: '2026-05-14T09:20:00Z', species: 'Tree Swallow', contents: 'Eggs', eggs: 2, chicks: 0, condition: 'Good', checkedBy: 'Alexis', notes: '' },
  { boxId: '28PM', timestamp: '2026-05-14T11:20:00Z', species: 'Other/Unknown', contents: 'Eggs', eggs: 6, chicks: 0, condition: 'Good', checkedBy: 'Alexis', notes: 'Sticks, trash, feathers' },
  { boxId: '36SM', timestamp: '2026-05-14T12:00:00Z', species: 'Other/Unknown', contents: 'Fledged', eggs: 0, chicks: 0, condition: 'Good', checkedBy: 'Alexis', notes: 'Poopy nest! Chicks fledged' },
  { boxId: '42MT', timestamp: '2026-05-14T12:30:00Z', species: 'Carolina Chickadee', contents: 'Fledged', eggs: 0, chicks: 3, condition: 'Good', checkedBy: 'Alexis', notes: 'Babies fledged!' },
  { boxId: '43AT', timestamp: '2026-05-14T12:35:00Z', species: 'Other/Unknown', contents: 'Abandoned', eggs: 0, chicks: 2, condition: 'Good', checkedBy: 'Alexis', notes: '2 dead chicks' },
];

// ============================================================================
// MAIN APP
// ============================================================================
function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regMode, setRegMode] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  const [boxes, setBoxes] = useState([]);
  const [checks, setChecks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedBox, setSelectedBox] = useState(null);
  const [sectionFilter, setSectionFilter] = useState('all');
  const [location, setLocation] = useState(null);
  const [panel, setPanel] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [checkForm, setCheckForm] = useState(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  // ============================================================================
  // AUTH STATE LISTENER
  // ============================================================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (profileDoc.exists()) {
          const profile = profileDoc.data();
          if (profile.status === 'approved') {
            setUserProfile(profile);
            setShowLogin(false);
          } else {
            setAuthError('Account pending approval');
            await signOut(auth);
          }
        } else {
          setAuthError('Profile not found');
          await signOut(auth);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setShowLogin(true);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ============================================================================
  // FIRESTORE LISTENERS
  // ============================================================================
  useEffect(() => {
    if (!user || !userProfile) return;

    // Listen to boxes
    const unsubBoxes = onSnapshot(collection(db, 'boxes'), (snapshot) => {
      const boxData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBoxes(boxData);
    });

    // Listen to checks
    const unsubChecks = onSnapshot(query(collection(db, 'checks'), orderBy('timestamp', 'desc')), (snapshot) => {
      const checkData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChecks(checkData);
    });

    // Listen to users (for admin)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userData);
    });

    return () => { unsubBoxes(); unsubChecks(); unsubUsers(); };
  }, [user, userProfile]);

  // ============================================================================
  // SEED DATA (first time only)
  // ============================================================================
  const seedData = async () => {
    const boxesSnapshot = await getDocs(collection(db, 'boxes'));
    if (boxesSnapshot.empty) {
      const batch = writeBatch(db);
      INITIAL_BOXES.forEach(box => {
        batch.set(doc(db, 'boxes', box.id), { ...box, lastChecked: '2026-05-14T12:00:00Z', lastCheckedBy: 'Alexis' });
      });
      await batch.commit();
      
      for (const check of INITIAL_CHECKS) {
        await addDoc(collection(db, 'checks'), check);
      }
    }
  };

  // ============================================================================
  // AUTH FUNCTIONS
  // ============================================================================
  const login = async () => {
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
    } catch (e) {
      setAuthError(e.message.includes('invalid') ? 'Invalid email or password' : e.message);
    }
  };

  const register = async () => {
    setAuthError('');
    if (!regForm.name || !regForm.email || !regForm.password) {
      setAuthError('Fill all fields');
      return;
    }
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const isFirst = usersSnapshot.empty;
      
      const cred = await createUserWithEmailAndPassword(auth, regForm.email, regForm.password);
      
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: regForm.name,
        email: regForm.email,
        role: isFirst ? 'admin' : 'volunteer',
        status: isFirst ? 'approved' : 'pending',
        createdAt: new Date().toISOString()
      });

      if (isFirst) {
        await seedData();
      } else {
        alert('Access requested! Admin will approve your account.');
        await signOut(auth);
        setRegMode(false);
        setRegForm({ name: '', email: '', password: '' });
      }
    } catch (e) {
      setAuthError(e.message.includes('email-already') ? 'Email already registered' : e.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setSelectedBox(null);
    setPanel(null);
  };

  const approveUser = async (userId) => {
    await updateDoc(doc(db, 'users', userId), { status: 'approved' });
  };

  const denyUser = async (userId) => {
    if (window.confirm('Remove this access request?')) {
      await deleteDoc(doc(db, 'users', userId));
    }
  };

  // ============================================================================
  // CHECK LOGGING
  // ============================================================================
  const startCheck = () => {
    setCheckForm({
      species: selectedBox.species || 'Empty',
      contents: selectedBox.contents || 'Empty',
      eggs: selectedBox.eggs || 0,
      chicks: selectedBox.chicks || 0,
      condition: selectedBox.condition || 'Good',
      notes: ''
    });
    setPanel('check');
  };

  const saveCheck = async () => {
    const ts = new Date().toISOString();
    
    // Add check to history
    await addDoc(collection(db, 'checks'), {
      boxId: selectedBox.id,
      ...checkForm,
      timestamp: ts,
      checkedBy: userProfile.name
    });

    // Update box current status
    await updateDoc(doc(db, 'boxes', selectedBox.id), {
      ...checkForm,
      lastChecked: ts,
      lastCheckedBy: userProfile.name
    });

    setSelectedBox(prev => ({ ...prev, ...checkForm, lastChecked: ts, lastCheckedBy: userProfile.name }));
    setCheckForm(null);
    setPanel(null);
    alert(`✓ Check logged by ${userProfile.name}`);
  };

  // ============================================================================
  // MAP
  // ============================================================================
  useEffect(() => {
    if (showLogin || !mapRef.current || mapInstanceRef.current) return;
    const L = window.L; if (!L) return;
    const map = L.map(mapRef.current, { center: CENTER, zoom: 16, zoomControl: false });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'ESRI' }).addTo(map);
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [showLogin]);

  useEffect(() => {
    if (showLogin || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(p => {
      const loc = { lat: p.coords.latitude, lng: p.coords.longitude }; setLocation(loc);
      if (mapInstanceRef.current && window.L) {
        const L = window.L;
        if (userMarkerRef.current) userMarkerRef.current.setLatLng([loc.lat, loc.lng]);
        else { userMarkerRef.current = L.marker([loc.lat, loc.lng], { icon: L.divIcon({ html: '<div style="width:16px;height:16px;background:#4a90d9;border:3px solid white;border-radius:50%"></div>', iconSize: [16,16], iconAnchor: [8,8] }), zIndexOffset: 1000 }).addTo(mapInstanceRef.current); }
      }
    }, () => {}, { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(id);
  }, [showLogin]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !boxes.length) return;
    const L = window.L, map = mapInstanceRef.current;
    markersRef.current.forEach(m => map.removeLayer(m)); markersRef.current = [];
    const filtered = sectionFilter === 'all' ? boxes : boxes.filter(b => b.section === sectionFilter);
    const offsets = { NM: [0.002,-0.002], TV: [0,-0.001], BW: [-0.001,0.001], PM: [-0.002,-0.002], SM: [0.001,0.002], MT: [-0.003,0], AT: [0.002,0.002] };
    filtered.forEach(box => {
      let [lat, lng] = [box.lat, box.lng];
      if (!lat) { const [oLat, oLng] = offsets[box.section] || [0,0]; const n = parseInt(box.id) || 1; lat = CENTER[0] + oLat + Math.sin(n)*0.0003; lng = CENTER[1] + oLng + Math.cos(n)*0.0003; }
      const color = getStatusColor(box.contents, box.condition);
      const marker = L.marker([lat, lng], { icon: L.divIcon({ html: `<div style="width:32px;height:32px;background:${color};border:3px solid white;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;color:white;box-shadow:0 2px 8px rgba(0,0,0,0.4)">${box.id.replace(/[A-Z]/g,'')}</div>`, iconSize: [32,32], iconAnchor: [16,16] }) }).addTo(map);
      marker.on('click', () => { setSelectedBox(box); setShowHistory(false); });
      markersRef.current.push(marker);
    });
  }, [boxes, sectionFilter]);

  // ============================================================================
  // HELPERS
  // ============================================================================
  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const getBoxChecks = (boxId) => checks.filter(c => c.boxId === boxId);
  const pendingUsers = users.filter(u => u.status === 'pending');
  const stats = { total: boxes.length, active: boxes.filter(b => ['Active Nest (no eggs yet)', 'Eggs', 'Chicks Only', 'Eggs + Chicks'].includes(b.contents)).length, maint: boxes.filter(b => ['Needs Maintenance', 'Needs Spraying'].includes(b.condition) || b.contents === 'Wasps / Hornets').length, urgent: boxes.filter(b => b.condition === 'Needs Attention').length };

  // ============================================================================
  // RENDER
  // ============================================================================
  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: BRAND.black }}><div style={{ width: 80, height: 80, background: BRAND.olive, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🪺</div><p style={{ color: BRAND.creamMuted, marginTop: 16 }}>Loading...</p></div>;

  if (showLogin) return (
    <div style={S.loginWrap}><div style={S.loginCard}>
      <div style={{ width: 80, height: 80, margin: '0 auto 16px', background: BRAND.olive, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🪺</div>
      <h1 style={{ margin: 0, fontSize: 20, color: BRAND.olive, textAlign: 'center' }}>Quinn Wildlife Sanctuary</h1>
      <p style={{ margin: '8px 0 20px', fontSize: 12, color: BRAND.creamMuted, textAlign: 'center' }}>Nest Box Monitoring</p>
      {authError && <p style={{ color: STATUS_COLORS.red, fontSize: 12, textAlign: 'center', marginBottom: 10 }}>{authError}</p>}
      {!regMode ? (<><input style={S.input} placeholder="Email" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} /><input style={S.input} type="password" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} onKeyPress={e => e.key === 'Enter' && login()} /><button style={S.btn} onClick={login}>Sign In</button><button style={S.link} onClick={() => { setRegMode(true); setAuthError(''); }}>Request Volunteer Access</button></>) : (<><input style={S.input} placeholder="Your Full Name" value={regForm.name} onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))} /><input style={S.input} placeholder="Email" value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} /><input style={S.input} type="password" placeholder="Create Password" value={regForm.password} onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))} /><button style={S.btn} onClick={register}>Request Access</button><button style={S.link} onClick={() => { setRegMode(false); setAuthError(''); }}>Back to login</button></>)}
      <p style={{ fontSize: 9, color: STATUS_COLORS.green, textAlign: 'center', marginTop: 12, padding: '6px 10px', background: STATUS_COLORS.green + '22', borderRadius: 6 }}>☁️ Cloud sync enabled</p>
    </div></div>
  );

  return (
    <div style={S.app}>
      <header style={S.header}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 32, height: 32, background: BRAND.olive, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🪺</div><div><div style={{ fontSize: 13, fontWeight: 600, color: BRAND.olive }}>QWS Nest Boxes</div><div style={{ fontSize: 10, color: BRAND.creamMuted }}>{userProfile?.name} ({userProfile?.role})</div></div></div><div style={{ display: 'flex', gap: 6 }}>{userProfile?.role === 'admin' && <button onClick={() => setPanel(panel === 'admin' ? null : 'admin')} style={{ ...S.smallBtn, background: pendingUsers.length ? STATUS_COLORS.red : BRAND.olive + '55' }}>{pendingUsers.length > 0 && '● '}Admin</button>}<button onClick={logout} style={S.smallBtn}>Logout</button></div></header>
      <div style={S.filterBar}><button onClick={() => setSectionFilter('all')} style={{ ...S.filterBtn, background: sectionFilter === 'all' ? BRAND.olive : 'transparent' }}>All</button>{SECTIONS.map(s => <button key={s.id} onClick={() => setSectionFilter(s.id)} style={{ ...S.filterBtn, background: sectionFilter === s.id ? BRAND.olive : 'transparent' }}>{s.id}</button>)}</div>
      <div style={S.legend}><span style={{ color: STATUS_COLORS.green }}>●</span> Active <span style={{ color: STATUS_COLORS.blue, marginLeft: 6 }}>●</span> Ready <span style={{ color: STATUS_COLORS.orange, marginLeft: 6 }}>●</span> Maint <span style={{ color: STATUS_COLORS.red, marginLeft: 6 }}>●</span> Urgent</div>
      <div ref={mapRef} style={S.mapContainer}></div>
      <div style={S.mapControls}><button onClick={() => { if (location && mapInstanceRef.current) mapInstanceRef.current.setView([location.lat, location.lng], 18); }} style={S.controlBtn}>📍</button><button onClick={() => { if (mapInstanceRef.current) mapInstanceRef.current.setView(CENTER, 16); }} style={S.controlBtn}>🎯</button></div>
      <div style={S.statsBar}><div style={S.statItem}><span style={{ color: BRAND.cream }}>{stats.total}</span><span style={{ fontSize: 9 }}>Total</span></div><div style={S.statItem}><span style={{ color: STATUS_COLORS.green }}>{stats.active}</span><span style={{ fontSize: 9 }}>Active</span></div><div style={S.statItem}><span style={{ color: STATUS_COLORS.orange }}>{stats.maint}</span><span style={{ fontSize: 9 }}>Maint</span></div><div style={S.statItem}><span style={{ color: STATUS_COLORS.red }}>{stats.urgent}</span><span style={{ fontSize: 9 }}>Urgent</span></div></div>
      {location && <div style={S.coords}>📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</div>}

      {panel === 'admin' && userProfile?.role === 'admin' && (<div style={S.panel}><div style={S.panelHead}><span style={{ color: BRAND.olive, fontWeight: 600 }}>⚙️ Admin</span><button onClick={() => setPanel(null)} style={S.closeBtn}>✕</button></div>{pendingUsers.length > 0 && (<><div style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLORS.red, marginBottom: 8 }}>Pending ({pendingUsers.length})</div>{pendingUsers.map(u => (<div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: BRAND.black, borderRadius: 8, marginBottom: 6 }}><div><div style={{ color: BRAND.cream, fontWeight: 600 }}>{u.name}</div><div style={{ fontSize: 10, color: BRAND.creamMuted }}>{u.email}</div></div><div style={{ display: 'flex', gap: 6 }}><button onClick={() => approveUser(u.id)} style={{ ...S.smallBtn, background: STATUS_COLORS.green }}>✓</button><button onClick={() => denyUser(u.id)} style={{ ...S.smallBtn, background: STATUS_COLORS.red }}>✕</button></div></div>))}<hr style={{ border: 'none', borderTop: '1px solid ' + BRAND.olive + '33', margin: '12px 0' }}/></>)}<div style={{ fontSize: 12, color: BRAND.olive }}>Approved: {users.filter(u => u.status === 'approved').length}</div><div style={{ fontSize: 12, color: BRAND.creamMuted, marginTop: 8 }}>Total checks: {checks.length}</div></div>)}

      {selectedBox && !panel && (<div style={S.panel}><div style={S.panelHead}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 44, height: 44, background: getStatusColor(selectedBox.contents, selectedBox.condition), borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 'bold', color: 'white' }}>{selectedBox.id.replace(/[A-Z]/g, '')}</div><div><div style={{ fontSize: 16, fontWeight: 600, color: BRAND.cream }}>{selectedBox.id}</div><div style={{ fontSize: 11, color: BRAND.creamMuted }}>{SECTIONS.find(s => s.id === selectedBox.section)?.name}</div></div></div><button onClick={() => setSelectedBox(null)} style={S.closeBtn}>✕</button></div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}><span style={{ ...S.badge, background: getStatusColor(selectedBox.contents, selectedBox.condition) }}>{getStatusLabel(selectedBox.contents, selectedBox.condition)}</span><span style={{ ...S.badge, background: BRAND.blackLight }}>{selectedBox.species}</span><span style={{ ...S.badge, background: BRAND.blackLight }}>{selectedBox.contents}</span>{selectedBox.eggs > 0 && <span style={{ ...S.badge, background: STATUS_COLORS.green }}>🥚{selectedBox.eggs}</span>}{selectedBox.chicks > 0 && <span style={{ ...S.badge, background: STATUS_COLORS.green }}>🐣{selectedBox.chicks}</span>}</div>{selectedBox.notes && <p style={{ fontSize: 12, color: BRAND.creamMuted, margin: '0 0 10px', fontStyle: 'italic' }}>"{selectedBox.notes}"</p>}{selectedBox.lastChecked && <p style={{ fontSize: 10, color: BRAND.creamMuted, margin: '0 0 12px' }}>Last: {formatDate(selectedBox.lastChecked)} by {selectedBox.lastCheckedBy || 'Unknown'}</p>}<div style={{ display: 'flex', gap: 8 }}><button onClick={startCheck} style={{ ...S.btn, flex: 2, marginBottom: 0 }}>📝 Log Check</button><button onClick={() => setShowHistory(!showHistory)} style={{ ...S.btn, flex: 1, marginBottom: 0, background: showHistory ? STATUS_COLORS.blue : BRAND.blackLight }}>📜</button></div>{showHistory && (<div style={{ marginTop: 12, maxHeight: 150, overflow: 'auto', background: BRAND.black, borderRadius: 8, padding: 10 }}><div style={{ fontSize: 11, fontWeight: 600, color: BRAND.olive, marginBottom: 8 }}>History ({getBoxChecks(selectedBox.id).length})</div>{getBoxChecks(selectedBox.id).slice(0, 20).map(c => (<div key={c.id} style={{ padding: '6px 0', borderBottom: '1px solid ' + BRAND.olive + '22' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, fontWeight: 600, color: BRAND.cream }}>{formatDate(c.timestamp)}</span><span style={{ fontSize: 9, color: BRAND.creamMuted }}>{formatTime(c.timestamp)}</span></div><div style={{ fontSize: 10, color: BRAND.creamMuted }}>{c.contents}{c.eggs > 0 && ` · ${c.eggs} eggs`}{c.chicks > 0 && ` · ${c.chicks} chicks`}</div>{c.notes && <div style={{ fontSize: 10, color: BRAND.cream, fontStyle: 'italic' }}>"{c.notes}"</div>}<div style={{ fontSize: 9, color: BRAND.creamMuted }}>— {c.checkedBy || 'Unknown'}</div></div>))}</div>)}</div>)}

      {panel === 'check' && checkForm && (<div style={S.overlay}><div style={S.modal}><h3 style={{ color: BRAND.olive, margin: '0 0 16px' }}>📝 Log Check - {selectedBox.id}</h3><label style={S.label}>Species</label><select style={S.input} value={checkForm.species} onChange={e => setCheckForm(p => ({ ...p, species: e.target.value }))}>{SPECIES_OPTIONS.map(s => <option key={s}>{s}</option>)}</select><label style={S.label}>Contents</label><select style={S.input} value={checkForm.contents} onChange={e => setCheckForm(p => ({ ...p, contents: e.target.value }))}>{CONTENTS_OPTIONS.map(c => <option key={c}>{c}</option>)}</select><div style={{ display: 'flex', gap: 10 }}><div style={{ flex: 1 }}><label style={S.label}>Eggs</label><input type="number" min="0" style={S.input} value={checkForm.eggs} onChange={e => setCheckForm(p => ({ ...p, eggs: parseInt(e.target.value) || 0 }))} /></div><div style={{ flex: 1 }}><label style={S.label}>Chicks</label><input type="number" min="0" style={S.input} value={checkForm.chicks} onChange={e => setCheckForm(p => ({ ...p, chicks: parseInt(e.target.value) || 0 }))} /></div></div><label style={S.label}>Condition</label><select style={S.input} value={checkForm.condition} onChange={e => setCheckForm(p => ({ ...p, condition: e.target.value }))}>{CONDITION_OPTIONS.map(c => <option key={c}>{c}</option>)}</select><label style={S.label}>Notes</label><textarea style={{ ...S.input, minHeight: 60 }} value={checkForm.notes} onChange={e => setCheckForm(p => ({ ...p, notes: e.target.value }))} /><div style={{ display: 'flex', gap: 10, marginTop: 8 }}><button onClick={() => { setCheckForm(null); setPanel(null); }} style={{ ...S.btn, flex: 1, background: 'transparent', border: '1px solid ' + BRAND.creamMuted }}>Cancel</button><button onClick={saveCheck} style={{ ...S.btn, flex: 2 }}>✓ Save</button></div><p style={{ fontSize: 9, color: BRAND.creamMuted, textAlign: 'center', marginTop: 12 }}>☁️ Saves to cloud as: {userProfile?.name}</p></div></div>)}

      <nav style={S.nav}><button onClick={() => { setSelectedBox(null); setPanel(null); }} style={{ ...S.navBtn, background: !selectedBox && !panel ? BRAND.olive : 'transparent' }}><span style={{ fontSize: 20 }}>🗺️</span><span style={{ fontSize: 10 }}>Map</span></button><button style={S.navBtn}><span style={{ fontSize: 20 }}>📊</span><span style={{ fontSize: 10 }}>Reports</span></button><button style={S.navBtn}><span style={{ fontSize: 20 }}>⚙️</span><span style={{ fontSize: 10 }}>Settings</span></button></nav>
    </div>
  );
}

const S = {
  loginWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: BRAND.black, padding: 20 },
  loginCard: { background: BRAND.blackLight, borderRadius: 16, padding: 28, width: '100%', maxWidth: 340, border: '1px solid ' + BRAND.olive + '44' },
  input: { width: '100%', padding: 12, background: BRAND.black, border: '1px solid ' + BRAND.olive + '44', borderRadius: 8, color: BRAND.cream, fontSize: 14, marginBottom: 10, boxSizing: 'border-box' },
  label: { display: 'block', fontSize: 11, color: BRAND.creamMuted, marginBottom: 4 },
  btn: { width: '100%', padding: 12, background: BRAND.olive, border: 'none', borderRadius: 8, color: BRAND.cream, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 8 },
  link: { width: '100%', background: 'none', border: 'none', color: BRAND.olive, fontSize: 13, cursor: 'pointer' },
  smallBtn: { background: BRAND.olive + '55', border: 'none', borderRadius: 4, color: BRAND.cream, padding: '4px 10px', fontSize: 11, cursor: 'pointer' },
  badge: { fontSize: 10, padding: '3px 8px', borderRadius: 4, color: 'white' },
  app: { fontFamily: 'system-ui', background: BRAND.black, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: BRAND.blackLight + 'ee', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 },
  filterBar: { position: 'absolute', top: 52, left: 0, right: 0, display: 'flex', gap: 4, padding: '6px 10px', zIndex: 900, background: BRAND.black + 'dd', overflowX: 'auto' },
  filterBtn: { padding: '4px 10px', border: '1px solid ' + BRAND.olive + '44', borderRadius: 6, color: BRAND.cream, fontSize: 11, cursor: 'pointer' },
  legend: { position: 'absolute', top: 88, left: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: BRAND.blackLight + 'ee', borderRadius: 6, fontSize: 9, color: BRAND.creamMuted, zIndex: 900 },
  mapContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  mapControls: { position: 'absolute', right: 10, top: 110, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 1000 },
  controlBtn: { width: 40, height: 40, background: BRAND.blackLight + 'ee', border: '1px solid ' + BRAND.olive + '44', borderRadius: 8, color: BRAND.cream, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statsBar: { position: 'absolute', left: 10, top: 110, display: 'flex', gap: 8, padding: '6px 10px', background: BRAND.blackLight + 'ee', borderRadius: 8, zIndex: 900 },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', color: BRAND.cream, fontSize: 14, fontWeight: 600 },
  coords: { position: 'absolute', left: 10, bottom: 70, background: BRAND.blackLight + 'ee', borderRadius: 6, padding: '4px 8px', fontSize: 10, color: BRAND.creamMuted, zIndex: 1000 },
  panel: { position: 'absolute', left: 10, right: 10, bottom: 65, background: BRAND.blackLight + 'fa', border: '1px solid ' + BRAND.olive + '66', borderRadius: 12, padding: 16, zIndex: 1500, maxHeight: '55vh', overflow: 'auto' },
  panelHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  closeBtn: { background: 'none', border: 'none', color: BRAND.creamMuted, fontSize: 18, cursor: 'pointer', padding: 4 },
  nav: { display: 'flex', background: BRAND.blackLight + 'fa', borderTop: '1px solid ' + BRAND.olive + '33', position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000 },
  navBtn: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', background: 'none', border: 'none', color: BRAND.cream, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 },
  modal: { background: BRAND.blackLight, borderRadius: 16, padding: 24, width: '100%', maxWidth: 360, maxHeight: '85vh', overflow: 'auto' },
};

export default App;
