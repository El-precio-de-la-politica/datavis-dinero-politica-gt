import Phaser from 'phaser'
import { Blur } from "./graphics/blur"
import Papa from "papaparse"

var data = {
  orig_largo: 175, 
  orig_ancho: 82, 
  orig_grosor: 0.17,
  draw_scale: 0.35,
  dx_A: 51/0.3,
  dy_A: 24/0.3,
  dx_B: 70/0.3,
  dy_B: 12/0.3,

  minZoom: 0.2,
  maxZoom: 1.5
  
}

data["iso_angle_x"] = Math.tan(0.22);
data["iso_angle_y"] = Math.tan(0.53);
data["iso_basis_y"] = new Phaser.Math.Vector2(Math.sin(data.iso_angle_x), -Math.sin(data.iso_angle_y));
data["iso_basis_x"] = new Phaser.Math.Vector2(Math.cos(data.iso_angle_x), Math.cos(data.iso_angle_y));

var utils = {
    rnd: new Phaser.Math.RandomDataGenerator(0),
    CuboDeDinero: function (N, scene, x, y) {
        var v        =     data.orig_ancho*data.orig_grosor*data.orig_largo, 
            V        =     N*v, 
            pre_x    = Math.pow(V, 1/3) / data.orig_largo,
            final_x  =     Math.max(1, Math.ceil(pre_x)),
            pre_y    = Math.sqrt( V / (data.orig_largo * final_x) )/data.orig_ancho,
            final_y  = Math.max(1, Math.ceil(pre_y)),
            final_z  = Math.ceil(V/(data.orig_grosor * final_x * data.orig_largo * final_y * data.orig_ancho)) ;
        var ix =0, iy = 0;
        iy = -data.iso_basis_y.dot(new Phaser.Math.Vector2(0, (final_y-1)*data.orig_ancho*data.draw_scale));
        var alto  = iy + final_z*data.orig_grosor*data.draw_scale + data.iso_basis_y.dot(new Phaser.Math.Vector2((final_x+1)*data.orig_largo*data.draw_scale, 0)) + 5; 
        var ancho = data.iso_basis_x.dot(new Phaser.Math.Vector2((final_x)*data.orig_largo*data.draw_scale, (final_y)*data.orig_ancho*data.draw_scale)); 
        this.gameObject = new Phaser.GameObjects.RenderTexture(scene, x, y, ancho, alto);
        this.graphics = scene.add.graphics().setVisible(false);

        this.graphics.setTexture("billete_lado");
        this.graphics.fillStyle(0xdadb5e, 1);

        this.render = function () {
            for (var x = 1; x <= final_x; x++) {
                for (var y = 1; y <= final_y; y++) {
                    var xyvector = new Phaser.Math.Vector2((x-1)*data.orig_largo*data.draw_scale,  (y-1)*data.orig_ancho*data.draw_scale);
                    var ty = iy + data.iso_basis_y.dot(xyvector);
                    var tx = ix + data.iso_basis_x.dot(xyvector);
                    
                    if (y==1) { 
                        var draw_z = final_z * data.orig_grosor * data.draw_scale;
                        for (var z=1; z<draw_z-2; z++) {
                            this.graphics.lineStyle(1, utils.rnd.pick([0xcec89d, 0xf5dfd1, 0xe5cf81]), 1);
                            this.graphics.lineBetween(tx, ty+data.dy_B*data.draw_scale+z,tx+data.dx_A*data.draw_scale, ty+data.dy_A*data.draw_scale+z);
                        }
                        if (x!=final_x) {
                            this.graphics.lineStyle(2, 0x553515, 1);
                            this.graphics.lineBetween(tx+data.dx_A*data.draw_scale, ty+data.dy_A*data.draw_scale,tx+data.dx_A*data.draw_scale, ty+data.dy_A*data.draw_scale+draw_z-2);
                            //this.graphics.lineBetween(tx+52, ty+24,tx+71, ty+12);
                        }
                        
                    }
                    
                    if (x==final_x) { 
                        this.graphics.fillStyle(0x9a7b5e, 1);
                        var draw_z = final_z * data.orig_grosor * data.draw_scale;
                        this.graphics.beginPath();  
                        this.graphics.moveTo(tx+data.dx_A*data.draw_scale, ty+data.dy_A*data.draw_scale);
                        this.graphics.lineTo(tx+data.dx_B*data.draw_scale, ty+data.dy_B*data.draw_scale);
                        this.graphics.lineTo(tx+data.dx_B*data.draw_scale, ty+data.dy_B*data.draw_scale+draw_z-1);
                        this.graphics.lineTo(tx+data.dx_A*data.draw_scale, ty+data.dy_A*data.draw_scale+draw_z-1);

                        this.graphics.closePath();
                        this.graphics.fillPath();
                        if ( y<final_y) {
                            this.graphics.lineStyle(2, 0x553515, 1);
                            this.graphics.lineBetween(tx+data.dx_B*data.draw_scale + 1, ty+data.dy_B*data.draw_scale,tx+data.dx_B*data.draw_scale + 1, ty+data.dy_B*data.draw_scale+draw_z-2);
                            //this.graphics.lineBetween(tx+52, ty+24,tx+71, ty+12);
                        }
                    }
                    
                    this.gameObject .draw(
                        assets.billete, tx, ty);

                }
            } 
            this.gameObject .draw(this.graphics);
            this.graphics.clear();
        };
        
        this.gameObject.setData("billetesDims", { x: final_x, y: final_y, z: final_z });
        
        return this;
    },
    PlotDineros: function (dineros, scene) {
        var prevMonton = null;
        this.container = scene.add.container([],0,0);
        this.montones =  dineros.map(function (d) {
            var monton = new utils.CuboDeDinero(d.value/100, scene, 0, 0);
            if (prevMonton != null) {
                monton.gameObject.x = prevMonton.x + prevMonton.width + 100;
                monton.gameObject.y = prevMonton.y + prevMonton.height*0.2;
            }
            prevMonton = monton;
            this.container.add(monton);
            return monton;
        });
        
        return this;
    }
}

var assets = {
  billete: null
};

function loader() {
    var config = {
        type: Phaser.AUTO,
        width: 1000,
        height: 1000,
        parent: 'game-container',
        scene: {
            preload: preload,
            create: create
        },backgroundColor: 'rgb(255, 255, 255)'
    };
    
    var montonA;

    function preload ()
    {
        this.load.image('billete', 'assets/billete100_iso.png');
        this.load.image('billete_lado', 'assets/billete_lado.png');
        
        this._utils = {};
        this._utils.pipeline = this.game.renderer.addPipeline('Blur', new Blur(this.game));
        this._utils.pipeline .setFloat1('resolution', this.game.config.width);
        this._utils.pipeline .setFloat1('radius', 0.25);
        this._utils.pipeline .setFloat2('dir', 1.0, 1.0);
    }

    function create ()
    {
				this.cameras.main.setRenderToTexture(this._utils.pipeline);
				
        assets.billete = this.add.image(100, 100, "billete");
        assets.billete.setVisible(false).setScale(data.draw_scale).setOrigin(0,0);
        
        var textStyle = {
                font: '300 20px Rubik',
                fontWeight: "300",
                color: '#000000',
                align: 'center',
                backgroundColor: '#f0fff0',
                shadow: {
                    color: '#666666',
                    fill: true,
                    offsetX: 0,
                    offsetY: 0,
                    blur: 4
                },
                padding: {x: 20, y: 10}
            };
        var titleStyle = {
                font: '300 200px Rubik',
                color: '#000000',
                backgroundColor: '#ffffff',
                padding: {x: 20, y: 10}
            };
          
        var title07 = this.add.text(0, 850, "2004-2007", titleStyle );
        
        var B = new utils.CuboDeDinero(47e6/100, this, 0,0);
        this.add.existing(B.gameObject);
        //B.gameObject.camera.setRenderToTexture(this._utils.pipeline);
        B.render();
        this.add.text(B.gameObject.width/4,B.gameObject.height/4,"Q 47 000 000 ", textStyle);
        
        var C = new utils.CuboDeDinero(10e6/100, this, 550,250);
        this.add.existing(C.gameObject);
        C.render();
        this.add.text(550+C.gameObject.width/4,150+C.gameObject.height/4,"Q 10 000 000 ", textStyle);
                
        var D = new utils.CuboDeDinero(2e6/100, this, 420,500);
        this.add.existing(D.gameObject);
        D.render();
        this.add.text(500,550,"Q 2 000 000 ", textStyle);
				
				var A = new utils.CuboDeDinero(9e6/100, this, 50,450);
        this.add.existing(A.gameObject);
        A.render();
        this.add.text(A.gameObject.width/4,400+A.gameObject.height/4,"Q 9 000 000 ", textStyle);

        var E = new utils.CuboDeDinero(8e5/100, this, 450,660);
        this.add.existing(E.gameObject);
        E.render();
        this.add.text(500,680,"Q 800 000 ", textStyle);
        
				data.scrolling = false;
				var scene = this;
        scene.input.on('pointerdown', function(pointer){
            data.scrolling = true;
            data.scrollingOrigin = {x: pointer.x, y: pointer.y, camx: scene.cameras.main.scrollY, camy: scene.cameras.main.scrollY};
        });
        scene.input.on('pointerup', function(pointer){
            data.scrolling = false;
        });
        scene.input.on('pointermove', function(pointer, currentlyOver){
						if (data.scrolling) {
								var dx = pointer.x - data.scrollingOrigin.x; 
								var dy = pointer.y - data.scrollingOrigin.y;
								scene.cameras.main.scrollX = data.scrollingOrigin.camx - dx;
								scene.cameras.main.scrollY = data.scrollingOrigin.camy - dy;
						}
        });
				this.input.on('wheel', function (pointer, gameObjects, deltaX, deltaY, deltaZ) {

						var newZoom = scene.cameras.main.zoom + deltaY * 0.001;
						if (newZoom < data.minZoom) 
								newZoom = data.minZoom;
						else if (newZoom > data.maxZoom) 
								newZoom = data.maxZoom;
						scene.cameras.main.zoom = newZoom;
						//scene._utils.pipeline.setFloat1('radius', 0.10/(newZoom*newZoom) );
				});
				
        scene.cameras.main.zoom = 0.7;
    }
    
    function update ()
    {
    }
    
    function setDatabase(database) {
        // Agregar por período
        window.database = database;
        var aggMain = {};
        // Columns: ["", "FECHA_APORTE", "AÑO", "MONTO_float", "PARTIDO", "NOMBRE_COMPLETO", "FILIACIÓN"]
        database.forEach(function (row, i) {
            if (i == 0) return; // skip first row
            var periodo = Math.floor((row[2]-2004)/4);
            if (aggMain[periodo] === undefined) {
                aggMain[periodo] = {};
            }
            if (aggMain[periodo][row[4]]  === undefined) {
                aggMain[periodo][row[4]] = 0;
            }
            aggMain[periodo][row[4]] += parseFloat(row[3]);
        });
        console.log(aggMain);
    }

    var database = Papa.parse("/gte_financiamiento.csv", {
        download: true,
        complete: function (results, file) {
            setDatabase(results.data);
        }
    });
    var vis = new Phaser.Game(config);
    return vis;
}


export {loader}
