import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js";

import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js";

var renderer, scene, camera, controls, materials, meshHead;
var gui, guiMap;
var guiData = { material: "MeshStandard", map: "map" };

initStuff();
initExtension();
animate();

var guis = [];

function onMaterialChange(value) {
  if (guiMap) gui.remove(guiMap);

  guiData.map = "map";

  meshHead.material = materials[value];

  guiMap = gui
    .add(guiData, "map", meshHead.material.userData.extraProps)
    .onChange(onPropChange);

  onPropChange("map");
}

function onPropChange(value) {
  while (guis.length) {
    gui.remove(guis.pop());
  }

  var u = function () {
    let n = guiData.map;

    var texUpdate = meshHead.material[`${n}UpdateMatrix`];

    guis.push(
      gui
        .add(meshHead.material[`${n}Offset`], "x", 0, 5)
        .name(`${n}Offset U`)
        .onChange(texUpdate)
    );
    guis.push(
      gui
        .add(meshHead.material[`${n}Offset`], "y", 0, 5)
        .name(`${n}Offset V`)
        .onChange(texUpdate)
    );
    guis.push(
      gui
        .add(meshHead.material[`${n}Scale`], "x", 0, 5)
        .name(`${n}Scale U`)
        .onChange(texUpdate)
    );
    guis.push(
      gui
        .add(meshHead.material[`${n}Scale`], "y", 0, 5)
        .name(`${n}Scale V`)
        .onChange(texUpdate)
    );
    guis.push(
      gui
        .add(meshHead.material, `${n}Rotation`, 0, Math.PI * 2)
        .name(`${n}Rotation`)
        .onChange(texUpdate)
    );

  
  };

  if (!meshHead.material.userData.extraProps) {
    setTimeout(u, 100);
  } else {
    u();
  }
}

function initGUI() {
  gui = new dat.GUI();

  gui
    .add(guiData, "material", ["MeshPhong", "MeshStandard", "MeshLambert"])
    .onChange(onMaterialChange);

  onMaterialChange(guiData.material);
}

function initStuff() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  renderer.gammaOutput = true;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, 3, 0);

  scene.add(camera);

  const loader = new THREE.CubeTextureLoader();
  const textureBox = loader.load([
    "./resources/texture/box1.jpg",
    "./resources/texture/box1.jpg",
    "./resources/texture/box1.jpg",
    "./resources/texture/box1.jpg",
    "./resources/texture/box1.jpg",
    "./resources/texture/box1.jpg",
  ]);
  scene.background = textureBox;

  controls = new OrbitControls(camera, renderer.domElement);


  scene.add(new THREE.AmbientLight(0xffffff, 0.7));

  var light = new THREE.DirectionalLight(0xffffff, 0.4);
  light.position.set(50, 40, 0);

  light.castShadow = true;
  light.shadow.camera.left = -40;
  light.shadow.camera.right = 40;
  light.shadow.camera.top = 40;
  light.shadow.camera.bottom = -40;
  light.shadow.camera.near = 10;
  light.shadow.camera.far = 180;

  light.shadow.bias = -0.001;
  light.shadow.mapSize.width = 512;
  light.shadow.mapSize.height = 512;

  scene.add(light);

  window.addEventListener("resize", onWindowResize, false);

  // -----------------------------------------------------------------------------
}

// ------------------------------------ Geometría procedimental ----------------------------------------------

// Crear vertice con la geometria , la posision, si debe o no crearse las propiedades del vertice
var makeQuad = function (geometry, position, addFace, verts) {
  geometry.vertices.push(position);

  if (addFace) {
    var index1 = geometry.vertices.length - 1;
    var index2 = index1 - 1;
    var index3 = index1 - verts;
    var index4 = index1 - verts - 1;

    geometry.faces.push(new THREE.Face3(index2, index3, index1));
    geometry.faces.push(new THREE.Face3(index2, index4, index3));
  }
};

var makeTile = function (size, res) {
  let geometryTile = new THREE.Geometry();
  for (var i = 0; i <= res; i++) {
    for (var j = 0; j <= res; j++) {
      var z = i * size + (Math.random() - 5) * size;
      var x = i * size + (Math.random() - 5) * size;
      var y = Math.random() * 5;
      var position = new THREE.Vector3(x, y, z);
      var addFace = i > 0 && j > 0;
      makeQuad(geometryTile, position, addFace, res + 1);
    }
  }
  geometryTile.computeFaceNormals();
  geometryTile.normalsNeedUpdate = true;

  return geometryTile;
};

var meshProcedimental = new THREE.Mesh(
  makeTile(3, 10),
  new THREE.MeshNormalMaterial({ side: THREE.DoubleSide })
);
scene.add(meshProcedimental);
meshProcedimental.position.y = 0;
meshProcedimental.position.x = -5;
meshProcedimental.rotation.x = Math.PI / 2;
meshProcedimental.rotation.z = Math.PI;

function initExtension() {
  // some textures ----------------------------------------------------------------------

  var texture = new THREE.TextureLoader().load("resources/texture/floor1.jpg");
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  //an environment map
  var envMap = new THREE.TextureLoader().load(
    "resources/texture/robot.jpg",
    function (texture) {
      texture.mapping = THREE.SphericalReflectionMapping;
      texture.encoding = THREE.sRGBEncoding;

      var color = 0xffffff;
      var altoCabeza = 1.2;
      var geometryHead = new THREE.CylinderGeometry(
        altoCabeza / 2 - 0.2,
        altoCabeza / 2,
        altoCabeza,
        100
      );
      var materialHead = materials[guiData.material];
      meshHead = new THREE.Mesh(geometryHead, materialHead);

      // Pos cabeza, este será el padre de todo el robot, se añade usando coordenadas globales
      var posYCabeza = 0;
      var posXCabeza = 0;
      var posZCabeza = 0;
      meshHead.position.set(posXCabeza, posYCabeza, posZCabeza);

      scene.add(meshHead);

      // -------------------------------------------------- Cilindro de arriba de la cabeza -----------------------------------------
      var alturaPelo = 0.4;
      var geometryCilinderHair = new THREE.CylinderGeometry(
        0.01,
        0.05,
        alturaPelo,
        100
      );
      var materialCabello = new THREE.MeshStandardMaterial({ color: 0x000001 });
      var meshHair = new THREE.Mesh(geometryCilinderHair, materialHead);

      // Se añade usando coordenadas locales
      meshHair.position.set(0, altoCabeza / 2 + alturaPelo / 2, 0);

      // Anidar a escena como hijo de cabeza
      meshHead.add(meshHair);

      /// -------------------------------------------------- Cabellos -----------------------------------------
      // Funcion para crearlos cabellos recursivamente. Para el primer cabello, se le asigna de padre el cilindro de cabeza, para los demas
      // el padre es el cilindro anterior de cabello
      function hacerCabello(
        numCabello,
        meshPadre,
        radioAnterior,
        totalCabellos,
        yInic
      ) {
        // Altura del cilindro
        let alturaCil = 0.03;

        // Cambia el material en cada iteracion
        let materialTemp = numCabello % 2 == 0 ? materialCabello : materialHead;

        // El radio se va reduciendo en cada iter
        let nuevoRadio = radioAnterior - 0.01;
        let geometryCilinderTemp = new THREE.CylinderGeometry(
          nuevoRadio,
          nuevoRadio,
          alturaCil,
          100
        );
        let meshHairTemp = new THREE.Mesh(geometryCilinderTemp, materialTemp);

        // Si es el primero, el cilindro va en cordenadas locales justo arriba de la cabeza, de lo contrario y es la altura de los cilindros
        let posY = numCabello === 0 ? yInic : alturaCil;

        // Se añade usando coordenadas locales
        meshHairTemp.position.set(0, posY, 0);

        // Anidar el cabello con la primitiva de la cabeza y añadir a la escena
        meshPadre.add(meshHairTemp);
        numCabello = numCabello + 1;

        // Añadir cabellos recursivamente hasta llegar al numero deseado
        if (numCabello !== totalCabellos) {
          hacerCabello(
            numCabello,
            meshHairTemp,
            nuevoRadio,
            totalCabellos,
            yInic
          );
        }
      }

      // Llamar a la función cabello recursivamente
      hacerCabello(0, meshHead, altoCabeza / 4, 11, altoCabeza / 2);

      //  ---------------------------------------- Ojos ------------------------------------------------------------
      var geometryEye = new THREE.TorusGeometry(0.12, 0.02, 10, 500);

      // Ojo derecho cada ojo se añade usando coordenadas locales
      var eye1 = new THREE.Mesh(geometryEye, materialCabello);
      eye1.position.set(-altoCabeza / 5, altoCabeza / 6, altoCabeza / 4 + 0.15);
      eye1.rotation.set(0, -Math.PI / 6, 0);

      // Ojo izquierdo
      var eye2 = new THREE.Mesh(geometryEye, materialCabello);
      eye2.position.set(altoCabeza / 5, altoCabeza / 6, altoCabeza / 4 + 0.15);
      eye2.rotation.set(0, Math.PI / 6, 0);

      //circulos para volver rojos los ojos
      const geometryCircle = new THREE.CircleGeometry(0.12, 32);
      const materialCircle = new THREE.MeshBasicMaterial({ color: 0xb3a1e6 });
      var circle = new THREE.Mesh(geometryCircle, materialCircle);
      var circle2 = circle.clone();
      eye1.add(circle);
      eye2.add(circle2);

      // Se anidan a la cabeza
      meshHead.add(eye1, eye2);

      // -----------------------------------boca -------------------------------------
      class CustomSinCurve extends THREE.Curve {
        constructor(scale = 1) {
          super();

          this.scale = scale;
        }

        getPoint(t, optionalTarget = new THREE.Vector3()) {
          const tx = t * 3 - 1.5;
          const ty = Math.sin(2 * Math.PI * t);
          const tz = 0;

          return optionalTarget.set(tx, ty, tz).multiplyScalar(this.scale);
        }
      }

      // Se crea un tubo con forma de sin que se cierra y se escala para que sea acorde al objeto
      const path = new CustomSinCurve(9);
      const geometry = new THREE.TubeGeometry(path, 64, 0.1, 8, true);
      const material = new THREE.MeshBasicMaterial({ color: 0x0c0c3d });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(1 / 50, 1 / 50, 1);

      // Añadir con cords locales y anidar con cabeza
      mesh.position.set(0, -altoCabeza / 4, altoCabeza / 4 + 0.25);
      meshHead.add(mesh);
      meshHead.add(mesh);

      //orejas
      // Funcion para crearlos cabellos recursivamente. Para el primer cabello, se le asigna de padre el cilindro de cabeza, para los demas
      // el padre es el cilindro anterior de cabello
      function hacerOrejas(
        numOreja,
        meshPadre,
        radioAnterior,
        totalOrejas,
        posY,
        growRight,
        xInic
      ) {
        // Altura del cilindro
        let alturaCil = 0.03;

        // Cambia el material en cada iteracion
        let materialTemp = numOreja % 2 == 0 ? materialCabello : materialHead;

        // El radio se va reduciendo en cada iter
        let nuevoRadio = radioAnterior - 0.01;
        let geometryCilinderTemp = new THREE.CylinderGeometry(
          nuevoRadio,
          nuevoRadio,
          alturaCil,
          100
        );
        let meshHairTemp = new THREE.Mesh(geometryCilinderTemp, materialTemp);

        // Si es el primero, el cilindro va en cordenadas locales justo arriba de la cabeza, de lo contrario y es la altura de los cilindros
        let posX = numOreja === 0 ? xInic : 0;

        posY = numOreja === 0 ? posY : alturaCil;
        posY = numOreja !== 0 ? (growRight ? posY : -posY) : posY;
        // Se añade usando coordenadas locales
        meshHairTemp.position.set(posX, posY, 0);

        let rotate = growRight ? Math.PI / 2.25 : Math.PI / 1.85;
        numOreja === 0
          ? (meshHairTemp.rotation.z = rotate)
          : (meshHairTemp.rotation.z = 0);

        // Anidar el cabello con la primitiva de la cabeza y añadir a la escena
        meshPadre.add(meshHairTemp);
        numOreja = numOreja + 1;

        // Añadir cabellos recursivamente hasta llegar al numero deseado
        if (numOreja !== totalOrejas) {
          hacerOrejas(
            numOreja,
            meshHairTemp,
            nuevoRadio,
            totalOrejas,
            posY,
            growRight,
            xInic
          );
        }
      }

      hacerOrejas(
        0,
        meshHead,
        altoCabeza / 4,
        6,
        altoCabeza / 5,
        true,
        -altoCabeza / 2.5
      );
      hacerOrejas(
        0,
        meshHead,
        altoCabeza / 4,
        6,
        altoCabeza / 5,
        false,
        altoCabeza / 2.5
      );
    }
  );

  // example ----------------------------------------------------------------------
  var setUvTransform = function (tx, ty, sx, sy, rotation, cx, cy) {
    var c = Math.cos(rotation);
    var s = Math.sin(rotation);

    this.set(
      sx * c,
      sx * s,
      -sx * (c * cx + s * cy) + cx + tx,
      -sy * s,
      sy * c,
      -sy * (-s * cx + c * cy) + cy + ty,
      0,
      0,
      0
    );
  };

  //create an instance of various types of materials
  materials = {
    MeshPhong: new THREE.MeshPhongMaterial({
      color: 0xffffff,
      envMap: envMap,
      fog: true,
      transparent: true,
    }),

    MeshStandard: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      envMap: envMap,
      metalness: 1,
      roughness: 1,
      fog: true,
      transparent: true,
    }),
    MeshLambert: new THREE.MeshLambertMaterial({
      color: 0xffffff,
      envMap: envMap,
      fog: true,
      transparent: true,
    }),
  };

  var validMaps = {
    map: true,
    roughnessMap: true,
    metalnessMap: true,
    specularMap: true,
  };

  /**
   * HACK:
   * this is actually "onBeforeParse" along with "onBeforeCompile"
   * for this effect to work, it would actually be beneficial to do it
   * in "onAfterParse" but before compilation,
   * it is safe to pre parse the includes which we can do like so:
   */
  var pattern = /#include <(.*)>/gm;

  function parseIncludes(string) {
    function replace(match, include) {
      var replace = THREE.ShaderChunk[include];
      return parseIncludes(replace);
    }
    return string.replace(pattern, replace);
  }

  /**
   * Solution:
   *
   * we can look for where vUv is used and extend those maps with their own
   * transform uniform, for this simple example we are going to use a vec4 to store
   * a per channel offset and scale
   */

  //look for maps that are mapped with vUv
  var mapRegex = /texture2D\( (.*Map|map), vUv \)/gm;

  //TODO: refactor this so props are created syncroncously (and props)
  var onBeforeCompile = function (shader) {
    var prependUniforms = "";
    var _this = this;

    function replaceMaps(string) {
      function replace(match, mapName) {
        if (!validMaps[mapName]) return match;

        let uniformName = `u_${mapName}Transform`;

        prependUniforms += `uniform mat3 ${uniformName};\n`;
        shader.uniforms[uniformName] =
          _this.userData.extraUniforms[uniformName];
        shader.uniforms[uniformName].name = uniformName;
        var replace = `texture2D( ${mapName}, ( ${uniformName} * vec3( vUv, 2. ) ).xy )`;

        return replaceMaps(replace);
      }

      return string.replace(mapRegex, replace);
    }

    shader.fragmentShader = parseIncludes(shader.fragmentShader); //"unroll" the entire shader
    shader.fragmentShader = replaceMaps(shader.fragmentShader); //patch in the mapping stuff

    shader.fragmentShader = prependUniforms + shader.fragmentShader;

    //init here so it can take params
    if (!gui) initGUI();
  };

  //extend these materials
  for (let materialName in materials) {
    var material = materials[materialName];

    const extraUniforms = {};
    material.userData.extraUniforms = extraUniforms;

    const extraProps = [];
    material.userData.extraProps = extraProps;

    for (var mapName in validMaps) {
      if (material[mapName] === null) {
        material[mapName] = texture;
        material[`${mapName}Scale`] = new THREE.Vector2(2, 2);
        material[`${mapName}Offset`] = new THREE.Vector2();
        material[`${mapName}Rotation`] = 0;

        var uniformName = `u_${mapName}Transform`;

        var uniform = { value: new THREE.Matrix3(), name: mapName };
        uniform.value.name = mapName;
        uniform.value.setUvTransform = setUvTransform.bind(uniform.value);

        extraUniforms[uniformName] = uniform;
        extraProps.push(mapName);

        let _mapName = mapName;
        let _uniformName = uniformName;

        material[`${mapName}UpdateMatrix`] = function () {
          this.userData.extraUniforms[_uniformName].value.setUvTransform(
            this[`${_mapName}Offset`].x,
            this[`${_mapName}Offset`].y,
            this[`${_mapName}Scale`].x,
            this[`${_mapName}Scale`].y,
            this[`${_mapName}Rotation`],
            0,
            0
          );
        }.bind(material);
      }
    }

    material.onBeforeCompile = onBeforeCompile.bind(material);
  }
}

function onWindowResize(event) {
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);

  if (meshHead) meshHead.rotation.y += 0.005;
  if (meshProcedimental) meshProcedimental.rotation.y += 0.005;
  renderer.render(scene, camera);
}
