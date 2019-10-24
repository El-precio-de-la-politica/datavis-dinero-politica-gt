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
    labelStyle: {
        font: '300 25px Rubik',
        fontWeight: "300",
        color: '#000000',
        backgroundColor: '#ffffff',
        shadow: {
            color: '#666666',
            fill: true,
            offsetX: 0,
            offsetY: 0,
            blur: 2
        },
        padding: {x: 20, y: 10}
    },
    titleStyle: {
        font: '500 200px Rubik',
        color: '#000000',
        backgroundColor: '#ffffff',
        padding: {x: 20, y: 10}
    },
    formatMoney: function (amount, decimalCount = 0, decimal = ".", thousands = ",") {
        try {
            decimalCount = Math.abs(decimalCount);
            decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

            const negativeSign = amount < 0 ? "-" : "";

            let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
            let j = (i.length > 3) ? i.length % 3 : 0;

            return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
        } catch (e) {
            console.log(e)
        }
    }
}
function CuboDeDinero(N, scene, x, y) {
    
    var v        =     data.orig_ancho*data.orig_grosor*data.orig_largo, 
        V        =     N*v, 
        pre_x    = Math.pow(V, 1/3) / data.orig_largo,
        final_x  = Math.max(1, Math.ceil(pre_x)),
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
                        this.graphics.lineBetween(tx, ty+data.dy_B*data.draw_scale+z+1,tx+data.dx_A*data.draw_scale, ty+data.dy_A*data.draw_scale+z+1);
                    }
                    if (x!=final_x) {
                        this.graphics.lineStyle(2, 0x553515, 1);
                        this.graphics.lineBetween(tx+data.dx_A*data.draw_scale, ty+data.dy_A*data.draw_scale,tx+data.dx_A*data.draw_scale, ty+data.dy_A*data.draw_scale+draw_z-2);
                        //this.graphics.lineBetween(tx+52, ty+24,tx+71, ty+12);
                    }
                    
                }
                
                if (x==final_x) { 
                    // this.graphics.fillStyle(0xaa8b6e, 1);
                    var draw_z = final_z * data.orig_grosor * data.draw_scale;
                    for (var z=1; z<draw_z-1; z++) {
                        this.graphics.lineStyle(2, utils.rnd.pick([0xcec89d-0x333333, 0xf5dfd1-0x333333, 0xe5cf81-0x333333]), 1);
                        this.graphics.lineBetween(tx+data.dx_A*data.draw_scale, 
                                                  ty+data.dy_A*data.draw_scale+z+1,
                                                  tx+data.dx_B*data.draw_scale, 
                                                  ty+data.dy_B*data.draw_scale+z+1);
                    }
                    /*this.graphics.beginPath();  
                    this.graphics.moveTo(tx+data.dx_A*data.draw_scale, ty+data.dy_A*data.draw_scale+1);
                    this.graphics.lineTo(tx+data.dx_B*data.draw_scale, ty+data.dy_B*data.draw_scale+1);
                    this.graphics.lineTo(tx+data.dx_B*data.draw_scale, ty+data.dy_B*data.draw_scale+draw_z);
                    this.graphics.lineTo(tx+data.dx_A*data.draw_scale, ty+data.dy_A*data.draw_scale+draw_z);

                    this.graphics.closePath();
                    this.graphics.fillPath();*/
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
}
function PlotDineros(dineros, scene) {
      var prevMonton = null;
      var firstCol = null;
      this.container = scene.add.container([],0,0);
      var that = this;
      this.montones =  dineros.map(function (d, i) {
          var monton = new CuboDeDinero(d.value/100, scene, 0, 0);
          if (prevMonton != null) {
              monton.gameObject.x = prevMonton.gameObject.x + Math.max(300, prevMonton.gameObject.width*0.75)  + 100;
              monton.gameObject.y = prevMonton.gameObject.y + prevMonton.gameObject.height*1.15 - monton.gameObject.height;
          }
          if (i%4 == 0 && prevMonton) {
              monton.gameObject.x = 50*i/4;
              monton.gameObject.y = firstCol.gameObject.y+firstCol.gameObject.height+100;
              firstCol = monton;
          }
          if (i==0) {
              firstCol = monton;
          }

          prevMonton = monton;
          monton.data = d;
          monton.label = new Phaser.GameObjects.Text(
            scene, 
            monton.gameObject.x + monton.gameObject.width/2,
            monton.gameObject.y - 50, // + monton.gameObject.height,
            "Q" + utils.formatMoney(Math.floor(d.value)), 
            utils.labelStyle
          );
          monton.label.setOrigin(0,0);
          monton.logo = new Phaser.GameObjects.Image(
            scene,
            monton.label.x-50,
            monton.gameObject.y - 40, //+ monton.gameObject.height,
            'logo_dummy'
          );
          monton.logo.setDisplaySize(100,100);
          that.container.add([monton.logo, monton.gameObject, monton.label]);
          monton.render();
          return monton;
      });
      
      return this;
  }

var assets = {
  billete: null
};

function loader() {
    var viewport = { width: 1000, height: 1000 };
    var config = {
        type: Phaser.WEBGL,
        width: viewport.width,
        height: viewport.height,
        parent: 'game-container',
        scene: {
            preload: preload,
            create: create
        },
        backgroundColor: 'rgb(255, 255, 255)',
        render: {
          antialias: true
        }
    };
    
    var montonA;
    var scene;

    function preload ()
    {
        this.load.image('billete', 'assets/billete100_iso.png');
        this.load.image('billete_lado', 'assets/billete_lado.png');
        this.load.image('logo_dummy', 'assets/logo.png');
        this._utils = {};
        this._utils.pipeline = this.game.renderer.addPipeline('Blur', new Blur(this.game));
        this._utils.pipeline .setFloat1('resolution', 2000);
        this._utils.pipeline .setFloat1('radius', 1);
        this._utils.pipeline .setFloat2('dir', 1.0, 1.0);

    }

    function create ()
    {
        scene = this;
        console.log(this.game.renderer);
        assets.billete = this.add.image(100, 100, "billete");
        assets.billete.setVisible(false).setScale(data.draw_scale).setOrigin(0,0);

        var database = Papa.parse("gte_financiamiento.csv", {
            download: true,
            complete: function (results, file) {
                setDatabase(results.data);
            }
        });
        
//         this.cameras.main.setRenderToTexture(this._utils.pipeline);
        
        data.scrolling = false;
        /*
        scene.input.on('pointerdown', function(pointer){
            data.scrolling = true;
            data.scrollingOrigin = {x: pointer.x, y: pointer.y, camx: scene.cameras.main.scrollX, camy: scene.cameras.main.scrollY};
        });
        scene.input.on('pointerup', function(pointer){
            data.scrolling = false;
        });
        scene.input.on('pointermove', function(pointer, currentlyOver){
            if (data.scrolling) {
                var scale = scene.cameras.main.zoom ;//Math.pow(scene.cameras.main.zoom,2);
                var dx = pointer.x - data.scrollingOrigin.x; 
                var dy = pointer.y - data.scrollingOrigin.y;
                scene.cameras.main.scrollX = (data.scrollingOrigin.camx - dx/scale);
                scene.cameras.main.scrollY = (data.scrollingOrigin.camy - dy/scale);
            }
        });
        this.input.on('wheel', function (pointer, gameObjects, deltaX, deltaY, deltaZ) {

            var newZoom = scene.cameras.main.zoom + deltaY * 0.001;
            if (newZoom < data.minZoom) 
                newZoom = data.minZoom;
            else if (newZoom > data.maxZoom) 
                newZoom = data.maxZoom;
            scene.cameras.main.setZoom(newZoom);
        });
        */
    }
    
    function update ()
    {
    }
    
    function setDatabase(database) {
        // Agregar por período
        window.database = database;
        var aggMain = {}, aggArray = [];
        // Columns: ["", "FECHA_APORTE", "AÑO", "MONTO_float", "PARTIDO", "NOMBRE_COMPLETO", "FILIACIÓN"]
        database.forEach(function (row, i) {
            if (i == 0 || row[3] == "NaN") return; // skip first row
            var periodo = Math.floor((row[2]-2004)/4);
            if (aggMain[periodo] === undefined) {
                aggMain[periodo] = {};
            }
            if (aggMain[periodo][row[4]]  === undefined) {
                aggMain[periodo][row[4]] =  { value: 0, id: row[4] };
            }
            aggMain[periodo][row[4]].value += parseFloat(row[3]) || 0;
        });
        
        // Plot
        var years =  Object.getOwnPropertyNames(aggMain).map(function (d) {
            return {
                "id": d, 
                "data": Object.getOwnPropertyNames(aggMain[d]).map(function (f) {
                    return aggMain[d][f];
                }).sort(function (a, b) { return - a.value + b.value; } )
            }
        });
        
        var prevYear = null;
        var yearsLabels = {
            0: "2007",
            1: "2011",
            2: "2015"
        };
        var selYear = null;
        var maxHeight = 0, totalWidth = 0;
        var yearsMontones = years.map(function (d) {
            if (!isNaN(d.id)) {
                var plot = new PlotDineros(d.data, scene);
                scene.add.existing(plot.container);
                
                if (prevYear != null) {
                    var boundsPrev = prevYear.container.getBounds();
                    plot.container.x = boundsPrev.width + boundsPrev.x + 400;
                }
                
                var bounds = plot.container.getBounds();
                
                plot.container.y = -bounds.height;
                plot.label = new Phaser.GameObjects.Text(
                  scene, 
                  bounds.width / 2,
                  bounds.height + 50, // + monton.gameObject.height,
                  yearsLabels[d.id], 
                  utils.titleStyle
                );
                plot.label.setOrigin(0.5,0);
                plot.container.add(plot.label);
                
                if (maxHeight < bounds.height) maxHeight = bounds.height;
                totalWidth += bounds.width;
                
                // recalcular los bounds
                bounds = plot.container.getBounds();
                console.log(bounds);
                plot.container.setInteractive(new Phaser.Geom.Rectangle(0, 0, bounds.width, bounds.height), Phaser.Geom.Rectangle.Contains);
                plot.container.on("pointerdown", function (pointer) {
                    console.log("clicked", plot, d, selYear);
                    if (selYear == d.id) {
                        selYear = null;
                        resetViewport(true);
                    }
                    else {
                        selYear = d.id;
                        var newZoom = 0.7*viewport.height/bounds.height;
                        scene.cameras.main.zoomTo(newZoom, 500, Phaser.Math.Easing.Linear.In, true);
                        scene.cameras.main.pan(bounds.x+bounds.width/2, -bounds.height/2+300, 500, Phaser.Math.Easing.Circular.Out, true)
                    }
                });
                
                prevYear = plot;
                return plot;
            } 
        });
        
        function resetViewport(ease) {
            if (ease) {
                scene.cameras.main.pan(totalWidth/2+500, -maxHeight/2 + 200 + 500, 400, Phaser.Math.Easing.Linear.In, true);
                scene.cameras.main.zoomTo(0.75*viewport.width/totalWidth, 400, Phaser.Math.Easing.Circular.Out, true);
            }
            else {
                scene.cameras.main.setScroll(totalWidth/2, -maxHeight/2 + 200);
                scene.cameras.main.setZoom(0.75*viewport.width/totalWidth);
            }
        }
        
        resetViewport();
    }
    
    var vis = new Phaser.Game(config);
    console.log(vis);
    return vis;
}


export {loader}
