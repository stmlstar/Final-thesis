
	var DEBUG = true;  
	var video = document.getElementById("mainVideo");
	var threshold = 128;
	//turn on JSARToolKit built-in debugging info
	
	//Try to get UserMedia
	//stream video
	navigator.getUserMedia = (navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia);

	if (navigator.getUserMedia) {
		navigator.getUserMedia (
		
		// constraints
		{
		video: true,
		//audio: true
		},
		
		// successCallback
		function(localMediaStream) {	
		//createObjectURL = tao 1 doi tuong DOMString co gia tri = tham so
		video.src = window.URL.createObjectURL(localMediaStream);
		// Do something with the video here, e.g. video.play()
		},		
		// errorCallback
		function(err) {
		console.log("The following error occured: " + err);
		}
		);
	} else {
	console.log("getUserMedia not supported");
	}
	
	$(document).ready(function() {
		console.log('Document is ready.');
		//lay canvas
		var canvas = document.getElementById("mainCanvas");
		
		
		//Tao moi doi tuong raster doi voi 2D canvas
		//JSARToolkit su dung raster obj de doc du lieu anh
		// set canvas.changed= true doi voi tat ca cac frame

		var raster = new NyARRgbRaster_Canvas2D(canvas);
		console.log("Setting up JSARToolKit!");
		//FLARParam duoc dung de set camera parameters (co tac dung transform coordinates tu detector sang raster)
		// duoi day tao flarparam doi voi anh 640x480
		var param = new FLARParam(640,480);
		// create detection engine cho marker detection
		var detector = new FLARMultiIdMarkerDetector(param,120);
		//tracking video set continue mode
		detector.setContinueMode(true);

		//copy the  ma tran phoi canh camera tu FLARParam sang webgl library camera matrix
		//-cai nay de sau sang phan xu ly voi threejs
		//param.copyCameraMatrix(display.camera.perspectiveMatrix,10,10000);
		
		
	//handle texure
		var videoTexture = new THREE.Texture(video);
		//Detecting markers
		//First draw the video frame to the raster canvas, scaled to 640x480
	//-error get context of NULL??? wth la	
		canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
		canvas.changed = true;
		console.log("canvas.width = ",canvas.width);
		console.log("raster.width = ",raster.width);
		//--lenh in van in ra dung ma sao dong duoi no k chay dc?!!!!
		//detect marker by using detector obj on raster obj
		console.log("Finish detect marker");
		var markerCount = detector.detectMarkerLite(raster,threshold);
		console.log("Finish counting marker");
		//last step, do it through the detected markers and got the transformation to putting 3d obj on the top of the markes
		
		// Create a NyARTransMatResult object for getting the marker translation matrices.
		var resultMat = new NyARTransMatResult();

		var markers = {};

		// Go through the detected markers and get their IDs and transformation matrices.
		for (var idx = 0; idx < markerCount; idx++) {
		  // Get the ID marker data for the current marker.
		  // ID markers are special kind of markers that encode a number.
		  // The bytes for the number are in the ID marker data.
		  var id = detector.getIdMarkerData(idx);

		  // Read bytes from the id packet.
		  var currId = -1;
		  // This code handles only 32-bit numbers or shorter.
	//	  ------Cho nua chua hieu lam
		  if (id.packetLength <= 4) {
			currId = 0;
			for (var i = 0; i < id.packetLength; i++) {
			  currId = (currId << 8) | id.getPacketData(i);
			}
		  }

		  // If this is a new id, let's start tracking it.
		  if (markers[currId] == null) {
			markers[currId] = {};
		  }
		  // Get the transformation matrix for the detected marker.
		  detector.getTransformMatrix(idx, resultMat);

		  // Copy the result matrix into our marker tracker object.
		  markers[currId].transform = Object.asCopy(resultMat);
		}
		
		//function mapping matrix from jsar to glmatrix (y-axis)
		
		//maxtrix mapping
		//conver FLARParam perspective matrix into a glMatrix-style matrix 
		//glMatrix nhu 1 kieu trung gian giua format cua jsar matrix va threejs matrix(Matrix4) 
		function copyMarkerMatrix(arMat, glMat) {
			  glMat[0] = arMat.m00;
			  glMat[1] = -arMat.m10;
			  glMat[2] = arMat.m20;
			  glMat[3] = 0;
			  glMat[4] = arMat.m01;
			  glMat[5] = -arMat.m11;
			  glMat[6] = arMat.m21;
			  glMat[7] = 0;
			  glMat[8] = -arMat.m02;
			  glMat[9] = arMat.m12;
			  glMat[10] = -arMat.m22;
			  glMat[11] = 0;
			  glMat[12] = arMat.m03;
			  glMat[13] = -arMat.m13;
			  glMat[14] = arMat.m23;
			  glMat[15] = 1;
			}
		//su dung three.js de ve len tren marker 1 cube 3D
		
		//function covert glMatrix into Three.js Matrix4
		//use glmatrix as intermediary
		THREE.Matrix4.prototype.setFromArray = function(m) {
			  return this.set(
				m[0], m[4], m[8], m[12],
				m[1], m[5], m[9], m[13],
				m[2], m[6], m[10], m[14],
				m[3], m[7], m[11], m[15]
			  );
			};
			//glMatrix
			var tmp = new Floar32Array(16);
			//create camera n marker root obj for Three.js scene
			var camera = new THREE.CAMERA();
			scene.add(camera);
			var markerRoot = new THREE.Object3D();
			markerRoot.matrixAutoUpdate = false;
			//add marker models
			var cube = new THREE.MEsh(
					new THREE.cubeGeometry(100,100,100),
					new THREE.MeshBasicMaterial({color: 0xff00ff})
					);
			cube.position.z = -50;
			markerRoot.add(cube);
			//Now we have the cute on the markerRoot, now add it to our scene
			scene.add(markerRoot);
			//now make Three.js camera use the FLARParam matrix
			param.copyCameraMatrix(tmp,10,10000);
			
			//display video, create texture from it
			var videoTex = new THREE.Texure(videoCanvas);
			//Crete the plane textured with the video
			var plane = new THREE.Mesh(
					new THREE.PlaneGeomeotry(2,2,0),
					new THREE.MeshBasicMaterial({map: videoTex})
			);
			//no need care about z-buffer
			plane.material.depthTest = false;
			plane.material.depthWrite = false;
			
			//create camera and scene for the video plane 
			// add the camera n the video plane to the scene
			var videoCam = new THREE.Camera();
			var videoScene = new THREE.Scene();
			videoScene.add(plane);
			video.Scene.add(videoCam);
			
			//do it for every frame below
			function tick() {
				//draw the video frame to the canvas
				videoCanvas.getContext('2d').drawImage(video,0,0);
				canvas.getContext('2d').drawImage(videoCanvs,0,0,canvas.width, canvas.height);
				//tell JSAR that canvas had changed
				canvas.changed = true;
				//update the video texture
				videoTex.needsUpdate = true;
				 // Detect the markers in the video frame.
				  var markerCount = detector.detectMarkerLite(raster, threshold);
				  for (var i=0; i<markerCount; i++) {
					// Get the marker matrix into the result matrix.
					detector.getTransformMatrix(i, resultMat);

					// Copy the marker matrix to the tmp matrix.
					copyMarkerMatrix(resultMat, tmp);

					// Copy the marker matrix over to your marker root object.
					markerRoot.matrix.setFromArray(tmp);
				  }

				  // Render the scene.
				  renderer.autoClear = false;
				  renderer.clear();
				  renderer.render(videoScene, videoCam);
				  renderer.render(scene, camera);
			}		
	});	
		
	

	
		
		
