import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { defineDiase, getUser } from '../api/ApiConnect';
import { useNavigate } from 'react-router-dom';
import HealthAssessmentDisplay from './HealthAssesmentDisplay';

const InteractiveBodyModel = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const bodyPartsRef = useRef({});
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
   const [users, setUsers] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const[chossingPart,setChossingPart]=useState([])
  const [symptomDescription, setSymptomDescription] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();
  const[showDisplay,setShowDishDisplay]=useState(false)
  const[health,setHealth]=useState(null);
  useEffect(() => {
      const fetchUsers = async () => {
        try {
          const response = await getUser();
          console.log(response.data)
          const filteredUsers = response.data.filter(user => user.name !== "family");
          console.log(filteredUsers)
          setUsers(filteredUsers);
  
          if (filteredUsers.length > 0) {
            setSelectedUser(filteredUsers[0]);
          }
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };
  
      fetchUsers();
    }, []);
  // Enhanced body parts data
  const bodyPartsData = {
    // Head and Face parts
    head: {
      name: "Head",
      category: "head",
      description: "The uppermost part of the body containing the brain and major sensory organs.",
      functions: ["Houses and protects the brain", "Contains sensory organs", "Cognitive processing center"]
    },
    face: {
      name: "Face",
      category: "head",
      description: "The front part of the head featuring eyes, nose, mouth, and facial muscles.",
      functions: ["Facial expressions and communication", "Primary location for sensory input", "Food intake and speech"]
    },
    neck: {
      name: "Neck",
      category: "head", 
      description: "Connects the head to the torso and contains vital pathways.",
      functions: ["Head movement and support", "Vital pathway for nerves and blood vessels", "Swallowing and breathing passage"]
    },
    
    // Torso parts
    chest: {
      name: "Chest",
      category: "torso",
      description: "Upper part of the torso containing heart and lungs.",
      functions: ["Protects vital organs", "Breathing mechanism", "Heart and lung function"]
    },
    belly: {
      name: "Belly/Abdomen",
      category: "torso",
      description: "Lower part of the torso containing digestive organs.",
      functions: ["Digestion and metabolism", "Waste processing", "Core stability"]
    },
    back: {
      name: "Back",
      category: "torso",
      description: "Posterior part of the torso providing structural support.",
      functions: ["Spinal cord protection", "Postural support", "Movement coordination"]
    },
    
    // Left arm parts
    leftShoulder: {
      name: "Left Shoulder",
      category: "arms",
      description: "Joint connecting the arm to the torso.",
      functions: ["Arm movement and rotation", "Load bearing", "Range of motion control"]
    },
    leftArm: {
      name: "Left Upper Arm",
      category: "arms",
      description: "Upper portion of the left arm containing major muscles.",
      functions: ["Lifting and carrying", "Arm flexion and extension", "Strength generation"]
    },
    leftElbow: {
      name: "Left Elbow",
      category: "arms",
      description: "Joint in the middle of the left arm.",
      functions: ["Arm bending and straightening", "Precision movement", "Force transmission"]
    },
    leftHand: {
      name: "Left Hand",
      category: "arms",
      description: "End portion of the left arm used for manipulation.",
      functions: ["Fine motor control", "Grasping and manipulation", "Tactile sensation"]
    },
    
    // Right arm parts
    rightShoulder: {
      name: "Right Shoulder",
      category: "arms",
      description: "Joint connecting the arm to the torso.",
      functions: ["Arm movement and rotation", "Load bearing", "Range of motion control"]
    },
    rightArm: {
      name: "Right Upper Arm",
      category: "arms",
      description: "Upper portion of the right arm containing major muscles.",
      functions: ["Lifting and carrying", "Arm flexion and extension", "Strength generation"]
    },
    rightElbow: {
      name: "Right Elbow",
      category: "arms",
      description: "Joint in the middle of the right arm.",
      functions: ["Arm bending and straightening", "Precision movement", "Force transmission"]
    },
    rightHand: {
      name: "Right Hand",
      category: "arms",
      description: "End portion of the right arm used for manipulation.",
      functions: ["Fine motor control", "Grasping and manipulation", "Tactile sensation"]
    },
    
    // Left leg parts
    leftFemoral: {
      name: "Left Thigh/Femoral",
      category: "legs",
      description: "Upper portion of the left leg containing the femur bone.",
      functions: ["Weight bearing", "Powerful leg movement", "Locomotion support"]
    },
    leftKnee: {
      name: "Left Knee",
      category: "legs",
      description: "Joint in the middle of the left leg.",
      functions: ["Leg bending and straightening", "Shock absorption", "Movement stability"]
    },
    leftLeg: {
      name: "Left Lower Leg",
      category: "legs",
      description: "Lower portion of the left leg between knee and foot.",
      functions: ["Support and balance", "Walking mechanics", "Propulsion generation"]
    },
    leftFoot: {
      name: "Left Foot",
      category: "legs",
      description: "End portion of the left leg used for walking and balance.",
      functions: ["Weight distribution", "Balance and stability", "Propulsion and shock absorption"]
    },
    
    // Right leg parts
    rightFemoral: {
      name: "Right Thigh/Femoral",
      category: "legs",
      description: "Upper portion of the right leg containing the femur bone.",
      functions: ["Weight bearing", "Powerful leg movement", "Locomotion support"]
    },
    rightKnee: {
      name: "Right Knee",
      category: "legs",
      description: "Joint in the middle of the right leg.",
      functions: ["Leg bending and straightening", "Shock absorption", "Movement stability"]
    },
    rightLeg: {
      name: "Right Lower Leg",
      category: "legs",
      description: "Lower portion of the right leg between knee and foot.",
      functions: ["Support and balance", "Walking mechanics", "Propulsion generation"]
    },
    rightFoot: {
      name: "Right Foot",
      category: "legs",
      description: "End portion of the right leg used for walking and balance.",
      functions: ["Weight distribution", "Balance and stability", "Propulsion and shock absorption"]
    }
  };

  const createBodyPart = (geometry, material, position, name, rotation = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.userData = { name, clickable: true };
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    bodyPartsRef.current[name] = mesh;
    return mesh;
  };

  const createHumanBody = () => {
    const group = new THREE.Group();
    
    // Materials
    const skinMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xfdbcb4, 
      shininess: 20,
      transparent: false
    });
    const clothingMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2c5aa0, 
      shininess: 15
    });
    const jointMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xe8b4a0, 
      shininess: 25
    });

    // HEAD AND FACE (reduced geometry complexity for performance)
    const headGeometry = new THREE.SphereGeometry(0.12, 12, 12); // Reduced from 16,16
    const head = createBodyPart(headGeometry, skinMaterial, [0, 1.65, 0], 'head');
    group.add(head);

    // Face (smaller sphere in front of head)
    const faceGeometry = new THREE.SphereGeometry(0.08, 8, 8); // Reduced from 12,12
    const face = createBodyPart(faceGeometry, skinMaterial, [0, 1.65, 0.08], 'face');
    group.add(face);

    // NECK  
    const neckGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.15, 8);
    const neck = createBodyPart(neckGeometry, skinMaterial, [0, 1.42, 0], 'neck');
    group.add(neck);

    // TORSO
    // Chest
    const chestGeometry = new THREE.BoxGeometry(0.35, 0.3, 0.2);
    const chest = createBodyPart(chestGeometry, clothingMaterial, [0, 1.2, 0], 'chest');
    group.add(chest);

    // Belly/Abdomen
    const bellyGeometry = new THREE.BoxGeometry(0.32, 0.25, 0.18);
    const belly = createBodyPart(bellyGeometry, clothingMaterial, [0, 0.9, 0], 'belly');
    group.add(belly);

    // Back
    const backGeometry = new THREE.BoxGeometry(0.35, 0.55, 0.15);
    const back = createBodyPart(backGeometry, clothingMaterial, [0, 1.05, -0.15], 'back');
    group.add(back);

    // LEFT ARM COMPONENTS
    // Left Shoulder
    const shoulderGeometry = new THREE.SphereGeometry(0.08, 12, 12);
    const leftShoulder = createBodyPart(shoulderGeometry, jointMaterial, [-0.22, 1.25, 0], 'leftShoulder');
    group.add(leftShoulder);

    // Left Upper Arm
    const upperArmGeometry = new THREE.CylinderGeometry(0.045, 0.05, 0.3, 8);
    const leftArm = createBodyPart(upperArmGeometry, skinMaterial, [-0.32, 1.05, 0], 'leftArm', [0, 0, Math.PI/8]);
    group.add(leftArm);

    // Left Elbow
    const elbowGeometry = new THREE.SphereGeometry(0.06, 10, 10);
    const leftElbow = createBodyPart(elbowGeometry, jointMaterial, [-0.38, 0.87, 0], 'leftElbow');
    group.add(leftElbow);

    // Left Forearm (part of lower arm)
    const forearmGeometry = new THREE.CylinderGeometry(0.04, 0.045, 0.25, 8);
    const leftForearm = createBodyPart(forearmGeometry, skinMaterial, [-0.44, 0.65, 0], 'leftForearm');
    group.add(leftForearm);

    // Left Hand
    const handGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.04);
    const leftHand = createBodyPart(handGeometry, skinMaterial, [-0.48, 0.45, 0], 'leftHand');
    group.add(leftHand);

    // RIGHT ARM COMPONENTS  
    // Right Shoulder
    const rightShoulder = createBodyPart(shoulderGeometry.clone(), jointMaterial, [0.22, 1.25, 0], 'rightShoulder');
    group.add(rightShoulder);

    // Right Upper Arm
    const rightArm = createBodyPart(upperArmGeometry.clone(), skinMaterial, [0.32, 1.05, 0], 'rightArm', [0, 0, -Math.PI/8]);
    group.add(rightArm);

    // Right Elbow
    const rightElbow = createBodyPart(elbowGeometry.clone(), jointMaterial, [0.38, 0.87, 0], 'rightElbow');
    group.add(rightElbow);

    // Right Forearm
    const rightForearm = createBodyPart(forearmGeometry.clone(), skinMaterial, [0.44, 0.65, 0], 'rightForearm');
    group.add(rightForearm);

    // Right Hand
    const rightHand = createBodyPart(handGeometry.clone(), skinMaterial, [0.48, 0.45, 0], 'rightHand');
    group.add(rightHand);

    // LEFT LEG COMPONENTS
    // Left Thigh/Femoral
    const thighGeometry = new THREE.CylinderGeometry(0.08, 0.09, 0.4, 8);
    const leftFemoral = createBodyPart(thighGeometry, clothingMaterial, [-0.1, 0.6, 0], 'leftFemoral');
    group.add(leftFemoral);

    // Left Knee
    const kneeGeometry = new THREE.SphereGeometry(0.07, 10, 10);
    const leftKnee = createBodyPart(kneeGeometry, jointMaterial, [-0.1, 0.35, 0], 'leftKnee');
    group.add(leftKnee);

    // Left Lower Leg
    const lowerLegGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.35, 8);
    const leftLeg = createBodyPart(lowerLegGeometry, skinMaterial, [-0.1, 0.15, 0], 'leftLeg');
    group.add(leftLeg);

    // Left Foot
    const footGeometry = new THREE.BoxGeometry(0.08, 0.06, 0.2);
    const leftFoot = createBodyPart(footGeometry, clothingMaterial, [-0.1, -0.05, 0.06], 'leftFoot');
    group.add(leftFoot);

    // RIGHT LEG COMPONENTS
    // Right Thigh/Femoral
    const rightFemoral = createBodyPart(thighGeometry.clone(), clothingMaterial, [0.1, 0.6, 0], 'rightFemoral');
    group.add(rightFemoral);

    // Right Knee
    const rightKnee = createBodyPart(kneeGeometry.clone(), jointMaterial, [0.1, 0.35, 0], 'rightKnee');
    group.add(rightKnee);

    // Right Lower Leg
    const rightLeg = createBodyPart(lowerLegGeometry.clone(), skinMaterial, [0.1, 0.15, 0], 'rightLeg');
    group.add(rightLeg);

    // Right Foot
    const rightFoot = createBodyPart(footGeometry.clone(), clothingMaterial, [0.1, -0.05, 0.06], 'rightFoot');
    group.add(rightFoot);

    return group;
  };

  // Initialize scene
  useEffect(() => {
    if (!mountRef.current) return;

    console.log("Initializing 3D scene...");

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75, 
      mountRef.current.clientWidth / mountRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(0, 1, 2.5);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // Renderer setup with performance optimizations
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: true
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0xf0f0f0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Create and add human body
    const humanBody = createHumanBody();
    scene.add(humanBody);
    
    console.log("Enhanced human body added to scene");
    console.log("Scene children:", scene.children.length);
    console.log("Body parts created:", Object.keys(bodyPartsRef.current));

    setIsLoading(false);

    // Animation loop with performance optimization
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      // Rotate the body slightly for better view
      if (humanBody) {
        humanBody.rotation.y += 0.005;
      }
      
      renderer.render(scene, camera);
    };
    animate();
    
    // Store animation ID for cleanup
    const currentAnimationId = animationId;

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      // Cancel animation frame
      if (currentAnimationId) {
        cancelAnimationFrame(currentAnimationId);
      }
      
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of geometries and materials
      scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      
      renderer.dispose();
    };
  }, []);

  // Mouse interaction handlers with throttling
  const handleMouseMove = (event) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Throttle raycasting for better performance
    if (Date.now() - (handleMouseMove.lastUpdate || 0) < 16) return; // ~60fps throttle
    handleMouseMove.lastUpdate = Date.now();

    // Raycast for hover effects
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);

    // Reset all hover effects
    Object.values(bodyPartsRef.current).forEach(part => {
      if (part && part.material) {
        part.material.emissive.setHex(0x000000);
      }
    });

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      if (intersectedObject.userData && intersectedObject.userData.clickable) {
        intersectedObject.material.emissive.setHex(0x444444);
        mountRef.current.style.cursor = 'pointer';
      }
    } else {
      mountRef.current.style.cursor = 'default';
    }
  };

  const handleClick = (event) => {
  if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;

  raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
  const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);

  if (intersects.length > 0) {
    const intersectedObject = intersects[0].object;
    const partName = intersectedObject.userData?.name;

    if (partName && bodyPartsData[partName]) {
      setSelectedPart(partName); // update UI
      setChossingPart(prev => [...prev, partName]); // thêm vào danh sách đã chọn

      console.log("Selected part:", partName);
      console.log("Chossing part list:", [...chossingPart, partName]); // chú ý: chossingPart ở đây vẫn là bản cũ
    }
  }
};
const handleDisease=async()=>{
  const slpart=chossingPart.join(',');
    const response =await defineDiase(slpart,symptomDescription,selectedUser.id)
    console.log(response.data);
    setHealth(response.data);
    setShowDishDisplay(true);
}
const handleRemove = (item) => {
    setChossingPart((prev) => prev.filter((part) => part !== item));
  };

  // Group body parts by category for better display
  const groupedBodyParts = Object.entries(bodyPartsData).reduce((acc, [key, part]) => {
    if (!acc[part.category]) {
      acc[part.category] = [];
    }
    acc[part.category].push({ key, ...part });
    return acc;
  }, {});

  const categoryNames = {
    head: "Head & Face",
    torso: "Torso",
    arms: "Arms & Hands", 
    legs: "Legs & Feet"
  };
if(showDisplay)
{return (<div>
<HealthAssessmentDisplay healthAssessment ={health}></HealthAssessmentDisplay>
</div>);
}
else{
}
  return (
    <div className="w-full h-screen bg-gray-50 flex">
      {/* 3D Viewer */}
      <div className="flex-1 relative">
        <div 
          ref={mountRef} 
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          style={{ minHeight: '500px' }}
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Enhanced 3D Model...</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-600">
            🖱️ Click on body parts to learn more<br/>
            🎯 Hover to highlight parts<br/>
            🔄 Model rotates automatically<br/>
            🧠 {Object.keys(bodyPartsData).length} interactive body parts
          </p>
        </div>
      </div>

      {/* Information Panel */}
      <div className="w-1/3 bg-white border-l border-gray-200 overflow-y-auto">
        {selectedPart ? (
          <div className="p-6">
            <div className="mb-4">
              <button 
                onClick={() => setSelectedPart(null)}
                className="text-blue-500 hover:text-blue-700 mb-2 flex items-center"
              >
                ← Back to overview
              </button>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {bodyPartsData[selectedPart].name}
              </h2>
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {categoryNames[bodyPartsData[selectedPart].category]}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600">{bodyPartsData[selectedPart].description}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Primary Functions</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {bodyPartsData[selectedPart].functions.map((func, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-1">•</span>
                      {func}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      {chossingPart.map((part, index) => (
        <div
          key={index}
          style={{
            padding: "5px 10px",
            borderRadius: "15px",
            backgroundColor: "#d0f0ff",
            display: "flex",
            alignItems: "center"
          }}
        >
          <span>{part}</span>
          <button
            onClick={() => handleRemove(part)}
            style={{
              marginLeft: "5px",
              background: "transparent",
              border: "none",
              color: "red",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            ❌
          </button>
        </div>
      ))}
      <div className="flex flex-col items-start gap-2 p-4 max-w-md mx-auto">
      <label className="text-sm font-medium text-gray-700">Symptom Description</label>
      <input
        type="text"
        value={symptomDescription}
        onChange={(e) => setSymptomDescription(e.target.value)}
        placeholder="e.g., Headache, nausea..."
        className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-gray-600 text-sm mt-2">You typed: <span className="font-semibold">{symptomDescription}</span></p>
    </div>
     
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                  selectedUser?.id === user.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
    </div>

 <div className="mt-6">
  <button
    onClick={handleDisease}
    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 ease-in-out transform hover:scale-105"
  >
    Thẩm định
  </button>
</div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Enhanced Human Body Explorer</h2>
            <p className="text-gray-600 mb-6">
              Explore {Object.keys(bodyPartsData).length} different body parts by clicking on the 3D model or selecting from the categories below.
            </p>
            
            <div className="space-y-6">
              {Object.entries(categoryNames).map(([category, categoryName]) => (
                <div key={category}>
                  <h3 className="font-semibold text-lg text-gray-800 mb-3 border-b border-gray-200 pb-1">
                    {categoryName}
                  </h3>
                  <div className="space-y-2">
                    {groupedBodyParts[category]?.map(({ key, name, description }) => (
                      <div 
                        key={key}
                        className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 cursor-pointer transition-colors border border-gray-100"
                        onClick={() => setSelectedPart(key)}
                      >
                        <h4 className="font-semibold text-blue-600 text-sm">{name}</h4>
                        <p className="text-xs text-gray-600 mt-1">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default InteractiveBodyModel;