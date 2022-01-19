mazeMap=function(scene,loc){
    let my_loc=loc,cli=false;
    if(!my_loc){
        my_loc=location.origin,cli=true;
    }
    const ambientlight = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    ambientlight.intensity=0.5;
    const sunlight = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(-1, -1, 0), scene);
    sunlight.intensity=0.7;
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:200,height:200}, scene);

    scene.clearColor=new BABYLON.Color3.Black;
    BABYLON.SceneLoader.Append(my_loc+"/objects/", "maze2.glb", scene, function (sc) {
        sc.meshes.forEach(r => {
            r.checkCollisions=true;
        })
    });

}

exports.mazeMap=mazeMap;