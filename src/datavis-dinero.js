import Phaser from 'phaser'
import { Blur } from "./graphics/blur"

var data = {
  viewport: {
      width: 900, height: 900
  },
  orig_largo: 202, 
  orig_ancho: 85, 
  orig_grosor: 35/100,
  draw_scale: 0.30,
  dx_A: 51/0.3,
  dy_A: 24/0.3,
  dx_B: 70/0.3,
  dy_B: 12/0.3,
  block_z_offset: 15, 
  minZoom: 0.1,
  maxZoom: 1.3,
  zBlurThreshold: 0.5
  
}

data["iso_angle_x"] = Math.tan(0.45);
data["iso_angle_y"] = Math.tan(0.42);
data["iso_basis_y"] = new Phaser.Math.Vector2(Math.sin(data.iso_angle_x), -Math.sin(data.iso_angle_y));
data["iso_basis_x"] = new Phaser.Math.Vector2(Math.cos(data.iso_angle_x), Math.cos(data.iso_angle_y));

var utils = {
    rnd: new Phaser.Math.RandomDataGenerator(0),
    yearsLabels: {
        0: "2007",
        1: "2011",
        2: "2015"
    },
    labelStyle: {
        font: '300 40px Rubik',
        fontWeight: "300",
        color: '#CC888F',
        shadow: {
        },
        padding: {x: 20, y: 10}
    },
    labelSelStyle: {
        font: '300 45px Rubik',
        color: '#660025', 
        padding: {x: 20, y: 10}
    },
    titleStyle: {
        font: '500 100px Rubik',
        color: '#dddddd',
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
    
    var v        =     data.orig_ancho*data.orig_grosor*data.orig_largo*100, 
        V        =     (N/10000)*v, 
        pre_x    = Math.pow(V, 1/3) / data.orig_largo,
        final_x  = Math.max(1, Math.ceil(pre_x)),
        pre_y    = Math.sqrt( V / (data.orig_largo * final_x) )/data.orig_ancho,
        final_y  = Math.max(1, Math.ceil(pre_y)),
        final_z  = Math.ceil(V/(data.orig_grosor * 100 * final_x * data.orig_largo * final_y * data.orig_ancho)) ;
    
    var ix =0, iy = 0;
    
    iy = -data.iso_basis_y.dot(new Phaser.Math.Vector2(0, (final_y-1)*data.orig_ancho*data.draw_scale));
    
    var alto  = iy + final_z*data.orig_grosor*100*data.draw_scale + data.iso_basis_y.dot(new Phaser.Math.Vector2((final_x+1)*data.orig_largo*data.draw_scale, 0)) + 5; 
    var ancho = data.iso_basis_x.dot(new Phaser.Math.Vector2((final_x)*data.orig_largo*data.draw_scale, (final_y)*data.orig_ancho*data.draw_scale)); 
    this.gameObject = new Phaser.GameObjects.RenderTexture(scene, x, y, ancho, alto);
    this.graphics = scene.add.graphics().setVisible(false);

    this.render = function (z) {
        this.gameObject.clear();
        for (var x = 1; x <= final_x; x++) {
            for (var y = final_y; y >= 1; y--) {
                for (var z = final_z; z >= 1; z--) {
                    // empty box
                    if (z==1 || y==1 || x==final_x)  {
                        var xyvector = new Phaser.Math.Vector2((x-1)*data.orig_largo*data.draw_scale + Math.random()*4-2, 
                                                              (y-1)*data.orig_ancho*data.draw_scale  + Math.random()*4-2);
                        var ty = iy + data.iso_basis_y.dot(xyvector) + z*data.orig_grosor*100*data.draw_scale, 
                            tx = ix + data.iso_basis_x.dot(xyvector);
                        
                        this.gameObject .draw(
                            (z&&z<data.zBlurThreshold)? assets.Q10000Blur:assets.Q10000 , tx, ty);
                    }
                }
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
      this.data = dineros;
      this.montones =  dineros.data.map(function (d, i) {
          var monton = new CuboDeDinero(d.value, scene, 0, 0);
          if (prevMonton != null) {
              monton.gameObject.x = prevMonton.gameObject.x + Math.max(400, prevMonton.gameObject.width*0.75)  + 100;
              monton.gameObject.y = prevMonton.gameObject.y + prevMonton.gameObject.height*1.15 - monton.gameObject.height;
          }
          if (i%4 == 0 && prevMonton) {
              monton.gameObject.x = 50*i/4;
              monton.gameObject.y = firstCol.gameObject.y+firstCol.gameObject.height+200;
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
            monton.gameObject.y - 150, // + monton.gameObject.height,
            d.partido + "\nQ " + utils.formatMoney(Math.floor(d.value)), 
            utils.labelStyle
          );
          monton.label.setOrigin(0,0);
          monton.logo = new Phaser.GameObjects.Image(
            scene,
            monton.label.x-70,
            monton.gameObject.y - 90, //+ monton.gameObject.height,
            d.logo_ref
          );
          monton.logo.setDisplaySize(140,140);
          that.container.add([monton.logo, monton.gameObject, monton.label]);
          monton.render();
          
          monton.onSelect = function () {
              monton.label.setStyle(utils.labelSelStyle);
              monton.logo.setDisplaySize(230,230);
              monton.logo.x = monton.label.x-120;
              
              var newZoom = 0.7*data.viewport.height/Math.max(monton.gameObject.height,800);
                
              scene.cameras.main.zoomTo(newZoom, 500, Phaser.Math.Easing.Linear.In, true);
              scene.cameras.main.pan(monton.gameObject.x + that.bounds.x + monton.gameObject.width/2, 
                                      + monton.gameObject.y + monton.gameObject.height/2 + 100 + that.bounds.y, 500, Phaser.Math.Easing.Circular.Out, true);
          };
          
          monton.onUnselect = function () {
              monton.label.setStyle(utils.labelStyle);
              monton.logo.setDisplaySize(140,140);
              monton.logo.x = monton.label.x-70;
          
          };
          
          return monton;
      });
      
  
      var bounds = this.container.getBounds();
    
      this.container.y = -bounds.height;
      this.label = new Phaser.GameObjects.Text(
          scene, 
          bounds.width / 2,
          bounds.height + 50,
          utils.yearsLabels[that.data.id], 
          utils.titleStyle
      );
      this.label.setOrigin(0.5,0);
      this.bounds = this.container.getBounds();
      this.label.setScale(5);
      this.container.add(this.label);
      
      this.onSelect = function () {
          that.montones.forEach((i)=> { 
              i.gameObject.setTint(0xffffff);
              i.label.setVisible(true);
              i.logo.x = i.label.x-90;
              i.gameObject.setInteractive();
              i.logo.setInteractive();
          });
          
          var newZoom = 0.7*data.viewport.height/Math.max(that.bounds.height, 1800);
          
          scene.cameras.main.zoomTo(newZoom, 500, Phaser.Math.Easing.Linear.In, true);
          scene.cameras.main.pan(that.bounds.x+that.bounds.width/2, -that.bounds.y - that.bounds.height, 500, Phaser.Math.Easing.Circular.Out, true);
      };
      
      this.onUnselect = function () {
          that.montones.forEach((i)=> { 
             // i.gameObject.setTint(0xcccccc);
              i.label.setVisible(false);
              i.logo.x = i.label.x;
              i.gameObject.disableInteractive();
              i.logo.disableInteractive();
          });
      };
      
      this.onUnselect();
      
      return this;
  }

var assets = {
  billete: null
};

function loader(database, emitter) {
    var config = {
        type: Phaser.WEBGL,
        width: data.viewport.width,
        height: data.viewport.height,
        parent: 'game-container',
        scene: {
            preload: preload,
            create: create
        },
        backgroundColor: 'rgb(255, 255, 255)',
        render: {
          antialias: true
        },
        scale: {
          mode: Phaser.Scale.FIT,
          parent: 'game-container',
          width: data.viewport.width,
          height: data.viewport.height
        },
    };
    
    var montonA;
    var scene;

    function preload ()
    {
        this.load.image('billete100', 'assets/Assets/Q100_Iso.png');
        this.load.image('billete10000', 'assets/Assets/Q100_Block.png');
        this.load.image('billete10000_blur', 'assets/Assets/Q100_Block_blur.png');
        
        var partidos = "Partidos_ADN, Partidos_FCN, Partidos_MI PAIS, Partidos_UNE, Partidos_VAMOS, Partidos_ANN, Partidos_FRG, Partidos_PAN, Partidos_UNIONISTA, Partidos_VICTORIA, Partidos_CREO, Partidos_LIDER, Partidos_PATRIOTA, Partidos_URNG, Partidos_WINAQ"
        partidos.split(", ").forEach( (partido)=> {
            this.load.image(partido, 'assets/Partidos/' + partido + '.png');
        });
        this._utils = {};
        this._utils.pipeline = this.game.renderer.addPipeline('Blur', new Blur(this.game));
        this._utils.pipeline .setFloat1('resolution', 2000);
        this._utils.pipeline .setFloat1('radius', 1);
        this._utils.pipeline .setFloat2('dir', 1.0, 1.0);

    }

    function create ()
    {
        scene = this;
        assets.Q10000 = this.add.image(100, 100, "billete10000");
        assets.Q10000.setVisible(false).setScale(0.72).setOrigin(0,0);
        assets.Q10000Blur = this.add.image(100, 100, "billete10000_blur");
        assets.Q10000Blur.setVisible(false).setScale(0.75).setOrigin(0,0);
        
//         this.cameras.main.setRenderToTexture(this._utils.pipeline);
        
        setDatabase(database);
        
        data.scrolling = false;
        data.scrollable = true;
        
        scene.input.on('pointerdown', function(pointer){
            if (data.scrollable == false) return;
            
            data.scrolling = true;
            data.scrolled = false;
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
                
                if (dx>10 || dy >10) {
                    data.scrolled = true;
                }
                else {
                    data.scrolled = false;
                }
            }
        });
        /*
        this.input.on('wheel', function (pointer, gameObjects, deltaX, deltaY, deltaZ) {
            pointer.event.stopPropagation();
            pointer.event.preventDefault();
            var newZoom = scene.cameras.main.zoom + deltaY * 0.001;
            if (newZoom < data.minZoom) 
                newZoom = data.minZoom;
            else if (newZoom > data.maxZoom) 
                newZoom = data.maxZoom;
            scene.cameras.main.setZoom(newZoom);
        });
        */
        this.game.input.mouse.capture = true;

    }
    
    function update ()
    {
    }
    
    
    var _partidosAbbr = {
        "Patriota": "PATRIOTA",
        "Líder": "LIDER",
        "Lider": "LIDER",
        "URNG MAIZ": "URNG",
        "Winaq": "WINAQ",
        "Victoria": "VICTORIA"
    };
    function partidosAbbr(inputStr) {
        return _partidosAbbr[inputStr] || inputStr;
    }
    
    function setDatabase(database) {
        // Agregar por período
        var aggMain = {}, aggArray = [];
        // Columns: ["", "FECHA_APORTE", "AÑO", "MONTO_float", "PARTIDO", "NOMBRE_COMPLETO", "FILIACIÓN"]
        database.forEach(function (row, i) {
            if (i == 0 || row[3] == "NaN") return; // skip first row
            var periodo = Math.floor((row[2]-2004)/4);
            if (aggMain[periodo] === undefined) {
                aggMain[periodo] = {};
            }
            if (aggMain[periodo][row[4]]  === undefined) {
                aggMain[periodo][row[4]] =  { 
                    value: 0, 
                    id: row[4],
                    year: row[2],
                    logo_ref: "Partidos_" + partidosAbbr(row[4]),
                    partido: row[4]
                };
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
        var selYear = null;
        var maxHeight = 0, totalWidth = 0;
        var yearsMontones = years.map(function (d) {
            if (isNaN(d.id)) return null;
                                      
            var plot = new PlotDineros(d, scene);
            scene.add.existing(plot.container);
            
            if (prevYear != null) {
                var boundsPrev = prevYear.bounds;
                plot.container.x = boundsPrev.width + boundsPrev.x + 400;
                plot.bounds = plot.container.getBounds();
            }
            
            if (maxHeight < plot.bounds.height) maxHeight = plot.bounds.height;
            
            totalWidth += plot.bounds.width;
            
            plot.container.setInteractive(new Phaser.Geom.Rectangle(0, 0, plot.bounds.width, plot.bounds.height), 
                                          Phaser.Geom.Rectangle.Contains);
            plot.container.on("pointerup", () => { 
                if (data.scrolled) return;
                emitter("select-ciclo", utils.yearsLabels[plot.data.id]);  
            });
            plot.montones.forEach(function (m) {
                if (data.scrolled) return;
                m.logo.on("pointerup", () => { emitter("select-partido", m.data.partido); } );
                m.gameObject.on("pointerup", () => { emitter("select-partido", m.data.partido); } );
            });
            
            prevYear = plot;
            return plot;
        });
        
        function selectCiclo(plot) {
            if (selYear) {
                selYear.onUnselect();
            }
            selYear = plot;
            if (selYear) {
                plot.onSelect();
            }
            else {
                selectPartido(null);
                resetViewport(true);
            }
        }
        
        var selPartido = null;
        function selectPartido(monton) {
            if (selYear) {
                selYear.onSelect();
            }
            if (selPartido) {
                selPartido.onUnselect();
            }
            selPartido = monton;
            if (selPartido) {
                selPartido.onSelect();
            }
        }
        
        scene.events.on("set-ciclo", function (val) {
            var found = false;
            yearsMontones.forEach((y) => {
                if (utils.yearsLabels[y.data.id] == val) {
                    selectCiclo(y);
                    found = true;
                    scene.game.canvas.classList.add("sharper");
                }
            });
            if (!found) {
                selectCiclo(null);
            }
        });
        
        scene.events.on("set-partido", function (val) {
            if (!selYear) return;
            var found = false;
            selYear.montones.forEach((m) => {
                if (m.data.partido == val) {
                    selectPartido(m);
                    found = true;
                    scene.game.canvas.classList.add("sharper");
                }
            });
            if (!found) {
                selectPartido(null);
            }
        });
        
        function resetViewport(ease) {
            if (ease) {
                scene.cameras.main.pan(totalWidth/2+500, -maxHeight/2 + 200 + 500, 400, Phaser.Math.Easing.Linear.In, true);
                scene.cameras.main.zoomTo(Math.min(0.75*data.viewport.width/totalWidth,
                                                   0.75*data.viewport.height/(maxHeight+300),
                                                   0.5
                                               ),
                                                   400, Phaser.Math.Easing.Circular.Out, true);
            }
            else {
                scene.cameras.main.setScroll(totalWidth/2, -maxHeight/2 + 200);
                scene.cameras.main.setZoom(Math.min(0.75*data.viewport.width/totalWidth,
                                                   0.75*data.viewport.height/(2*maxHeight + 300),
                                                    0.4
                                               ));
            }
            scene.game.canvas.classList.remove("sharper");
        }
        
        resetViewport();
    }
    
    var vis = new Phaser.Game(config);
    return vis;
}


export {loader}
