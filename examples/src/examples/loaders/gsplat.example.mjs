import * as pc from 'playcanvas';
import { deviceType, rootPath } from 'examples/utils';

const canvas = /** @type {HTMLCanvasElement} */ (
    document.getElementById('application-canvas')
);
window.focus();

const gfxOptions = {
    deviceTypes: [deviceType],
    glslangUrl: rootPath + '/static/lib/glslang/glslang.js',
    twgslUrl: rootPath + '/static/lib/twgsl/twgsl.js',

    // disable antialiasing as gaussian splats do not benefit from it and it's expensive
    antialias: false
};

const device = await pc.createGraphicsDevice(canvas, gfxOptions);
device.maxPixelRatio = Math.min(window.devicePixelRatio, 2);

const createOptions = new pc.AppOptions();
createOptions.graphicsDevice = device;
createOptions.mouse = new pc.Mouse(document.body);
createOptions.touch = new pc.TouchDevice(document.body);
createOptions.elementInput = new pc.ElementInput(canvas);

createOptions.componentSystems = [
    pc.RenderComponentSystem,
    pc.CameraComponentSystem,
    pc.LightComponentSystem,
    pc.ScriptComponentSystem,
    pc.GSplatComponentSystem,
    pc.ScreenComponentSystem,
    pc.ButtonComponentSystem,
    pc.ElementComponentSystem
];
createOptions.resourceHandlers = [
    pc.TextureHandler,
    pc.ContainerHandler,
    pc.ScriptHandler,
    pc.GSplatHandler,
    pc.FontHandler
];

const app = new pc.AppBase(canvas);
app.init(createOptions);

// Set the canvas to fill the window and automatically change resolution to be the same as the canvas size
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);

// Ensure canvas is resized when window changes size
const resize = () => app.resizeCanvas();
window.addEventListener('resize', resize);
app.on('destroy', () => {
    window.removeEventListener('resize', resize);
});

const assets = {
    target1: new pc.Asset('gsplat', 'gsplat', {
        url: rootPath + '/static/assets/splats/splat-limu15-crop.ply'
    }),
    target2: new pc.Asset('gsplat', 'gsplat', {
        url: rootPath + '/static/assets/splats/splat-limu19-crop.ply'
    }),
    target3: new pc.Asset('gsplat', 'gsplat', {
        url: rootPath + '/static/assets/splats/splat-limu20-crop.ply'
    }),
    orbit: new pc.Asset('script', 'script', {
        url: rootPath + '/static/scripts/camera/orbit-camera.js'
    }),
    font: new pc.Asset('font', 'font', {
        url: rootPath + '/static/assets/fonts/courier.json'
    })
};

const assetListLoader = new pc.AssetListLoader(
    Object.values(assets),
    app.assets
);
assetListLoader.load(() => {
    app.start();

    app.scene.rendering.toneMapping = pc.TONEMAP_ACES;

    // Create a 2D screen
    const screen = new pc.Entity();
    screen.addComponent('screen', {
        referenceResolution: new pc.Vec2(1280, 720),
        scaleBlend: 0.5,
        scaleMode: pc.SCALEMODE_BLEND,
        screenSpace: true
    });
    app.root.addChild(screen);

    // Create an Entity with a camera component
    const camera = new pc.Entity();
    camera.addComponent('camera', {
        clearColor: new pc.Color(0.2, 0.2, 0.2)
    });
    camera.setLocalPosition(2, 2, 0);

    const createSplatInstance = (
        name,
        resource,
        px,
        py,
        pz,
        rx,
        ry,
        rz,
        scale,
        vertex,
        fragment
    ) => {
        const splat = resource.instantiate({
            fragment: fragment,
            vertex: vertex
        });
        splat.name = name;
        splat.setLocalPosition(px, py, pz);
        splat.setLocalScale(scale, scale, scale);
        splat.setLocalEulerAngles(rx, ry, rz);
        app.root.addChild(splat);
        return splat;
    };

    const target1 = createSplatInstance(
        'target1',
        assets.target1.resource,
        -0.04,
        -0.08,
        -0.06,
        -13.86,
        -64,
        180 - 166.68,
        1.15
    );
    const target2 = createSplatInstance(
        'target2',
        assets.target2.resource,
        0,
        0,
        0,
        0,
        0,
        0,
        1
    );
    const target3 = createSplatInstance(
        'target3',
        assets.target3.resource,
        -0.04,
        0.02,
        -0.03,
        0,
        3.48,
        0,
        0.9
    );

    target2.enabled = false;
    target3.enabled = false;

    const createButtonInstance = (labelText, dx, dy, dz) => {
        // Button
        const button = new pc.Entity();
        button.addComponent('button');
        button.addComponent('element', {
            anchor: [0.5, 0.5, 0.5, 0.5],
            height: 40,
            pivot: [0.5, 0.5],
            type: pc.ELEMENTTYPE_IMAGE,
            width: 175,
            useInput: true
        });
        screen.addChild(button);

        // Create a label for the button
        const label = new pc.Entity();
        label.addComponent('element', {
            anchor: [0.5, 0.5, 0.5, 0.5],
            color: new pc.Color(0, 0, 0),
            fontAsset: assets.font.id,
            fontSize: 32,
            height: 64,
            pivot: [0.5, 0.5],
            text: labelText,
            type: pc.ELEMENTTYPE_TEXT,
            width: 128,
            wrapLines: true
        });
        button.addChild(label);
        button.setLocalPosition(dx, dy, dz);

        return button;
    };

    const button1 = createButtonInstance('V1', -200, -350, 0);
    button1.button.on('click', function () {
        console.log('V1');
        target1.enabled = true;
        target2.enabled = false;
        target3.enabled = false;
    });

    const button2 = createButtonInstance('V2', 0, -350, 0);
    button2.button.on('click', function () {
        console.log('V2');
        target1.enabled = false;
        target2.enabled = true;
        target3.enabled = false;
    });

    const button3 = createButtonInstance('V3', 200, -350, 0);
    button3.button.on('click', function () {
        console.log('V3');
        target1.enabled = false;
        target2.enabled = false;
        target3.enabled = true;
    });

    // add orbit camera script with a mouse and a touch support
    camera.addComponent('script');
    camera.script.create('orbitCamera', {
        attributes: {
            inertiaFactor: 0.2,
            focusEntity: target1,
            distanceMax: 60,
            frameOnStart: false
        }
    });
    camera.script.create('orbitCameraInputMouse');
    camera.script.create('orbitCameraInputTouch');
    app.root.addChild(camera);
});

export { app };
