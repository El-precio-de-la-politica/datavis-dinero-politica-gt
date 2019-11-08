<template>
  <div id="main-container">
      <div class="header">
        <div class="inner">
          <img class="logo" src="assets/Branding/Logo_Square_Ochre.png" />
          <div class="nav-breadcrumbs">
              <span class="btn select-msg" v-if="ciclo != null" @click="resetSels()">Volver </span>
              <span class="btn select-msg" v-if="ciclo == null">Selecciona un año</span>
              <span class="btn select-msg" v-if="ciclo != null" @click="partido = null">Elecciones {{ciclo}} </span>
              <span class="btn select-msg" v-if="ciclo != null && partido == null">Selecciona un partido</span>
              <span class="btn low"  v-if="partido != null">{{partido}}</span>
          </div>
        </div>
      </div>
      <div class="loading-db" v-if="!loadedVis">
        <Loader />
      </div>
      <div id="game-wrapper"> 
        <div id="game-container"></div>
      </div>
      <div :class="{'ver-mas': true, 'esconder': scrollTriggers.segundaparte}"><a class="btn low" href="#detalles">¿Quiénes dieron más?</a><br> <i class="fa fa-chevron-circle-down"></i></div>
      <div id="segundaparte" class="segunda-parte scroll-trigger">
          <div id="detalles"></div>
          <div v-if="partido" class="info-partido">
              <div v-if="!partidoData">
                  <div class="vacio">Partido sin información</div>
              </div>
              <div v-if="partidoData">
                <div class="partido-img">
                    <img class="avatar" :src="partidoData.Foto" >
                    <h2>{{partidoData.Partido_nombre}}</h2>
                    <h3>{{partidoData.Presidenciable}}</h3>
                    <img class="partido-logo" :src="partidoData.Logo" >
                </div>
                <div class="partido-detalles">
                    <div class="item" v-if="partidoData.Trayectoria_Presi">{{partidoData.Trayectoria_Presi}}</div>
                    <div class="item" v-if="partidoData.Vicepresidenciable">Vicepresidenciable: {{partidoData.Vicepresidenciable}}</div>
                    <div class="item" v-if="partidoData.Trayectoria_Vice">{{partidoData.Trayectoria_Vice}}</div>
                    <div class="item" v-if="partidoData.Explicativo">{{partidoData.Explicativo}}</div>
                </div>
              </div>
          </div>
          <div :class="{ 'top-financistas': true, 'sel-partido': partido!=null}">
              <div class="buscador">
                  <input v-model="filtroTop" placeholder="BUSCAR" />
                  <i class="fa fa-search icono"></i>
              </div>
              <div class="vacio" v-if="topFinancistas.length == 0">No se han encontrado financistas con ese nombre</div>
              <div id="listado-top-financistas"> 
                  <div class="financista" v-for="financista in topFinancistas">
                      {{financista[5]}} <span class="monto">Q {{abbrevMoney(financista[3])}}</span>
                      <span  class="partido">{{financista[4]}}</span>
                      <span   class="fecha">{{financista[1].substr(0,10) || parseInt(financista[2])}}</span>
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>

<script>
import Vue from 'vue'
import Loader from './Loader.vue'
import Papa from "papaparse"
import 'whatwg-fetch'


import * as dinero from './datavis-dinero'

var scroll = null;

export default {
  components: {
    Loader
  },
  data() {
    return {
      content: {
      },
      filtroTop: "",
      loadedVis: false,
      database: [],
      partido: null,
      ciclo: null,
      lastScrollPosition: 0,
      scrollTriggers: {},
      dataPartidos: []
    };  
  },
  methods: {
      onScroll () {
          const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop
          if (currentScrollPosition < 0) {
            return
          }
          var triggers = document.getElementsByClassName("scroll-trigger");
          for (var i=0; i<triggers.length; i++) { 
              var   rect = triggers[i].getBoundingClientRect();
              if ((rect.top+rect.height)>-1 && rect.top <= window.innerHeight*0.8)
                  Vue.set(this.scrollTriggers, triggers[i].id, true);
              else
                  Vue.set(this.scrollTriggers, triggers[i].id, false);
          }
          this.lastScrollPosition = currentScrollPosition
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
      },
      abbrevMoney (n) {
          if (n<1e3)
              return this.formatMoney(n, 0);
          else if (n<1e6) 
              return this.formatMoney(n/1e3, 1) + "K";
          else
              return this.formatMoney(n/1e6, 1) + "M";
      },
      resetSels () {
          this.partido = null;
          this.ciclo = null;
          scroll.animateScroll(0);
      }
  },
  computed: {
      topFinancistas() {
          if (this.database === undefined) return [];
          
          // Columns: ["", "FECHA_APORTE", "AÑO", "MONTO_float", "PARTIDO", "NOMBRE_COMPLETO", "FILIACIÓN"]
          var processedData = this.database.sort((a, b) => {
              return - a[3] + b[3];
          });
          
          if (this.filtroTop.length > 0) {
              var filtro = this.filtroTop.toLowerCase();
              processedData = processedData.filter((i)=> {
                  return i[7].indexOf(filtro, 0) != -1;
              });
          }
          
          if (this.ciclo!=null) {
              var filtro = this.ciclo;
              processedData = processedData.filter((i)=> {
                  return +i[2] <= +filtro && +i[2] >= +filtro-4;
              });
          }
          
          if (this.partido!=null) {
              var filtro = this.partido;
              processedData = processedData.filter((i)=> {
                  return i[4] == filtro;
              });
          }
          
          
          return processedData.slice(0,40);
      },
      partidoData() {
          var foundd = null;
          var that = this;
          if (this.partido == null) return null;
          console.log(this.dataPartidos, this.partido, this.ciclo);
          this.dataPartidos.forEach( function (d, i) {
              if ( d.Partido_id == that.partido && d.Year == that.ciclo)
                  foundd = d;
          });
          console.log(foundd);
          return foundd;
      }
  },

  async mounted() {
      window.addEventListener('scroll', this.onScroll)
      var that = this;
      fetch('data_partidos.json')
        .then(function(response) {
          return response.json()
        }).then(function(json) {
          Vue.set(that, "dataPartidos", json);
        }).catch(function(ex) {
          console.log('No se pudo cargar la información de los partidos', ex)
        });
      var database = Papa.parse("gte_financiamiento.csv", {
            download: true,
            complete: function (results, file) {
                results.data = results.data.filter((i) => {
                    return i[3] > 0 && i[2]>2007;
                });
                results.data = results.data.map((i) => {
                    i[3] = parseFloat(i[3]);
                    i[7] = i[5].toLowerCase();
                    return i;
                });
                Vue.set(that, "database", results.data);
                that.$nextTick(() => {
                    that.phaserVisuals = dinero.loader(results.data, 
                        (event, data) => {
                            that.$emit(event, data);
                        });
                    
                });
            }
        });
      this.$on("select-ciclo", (data) => {
          that.ciclo = data;
          scroll.animateScroll(0);
      });
      this.$on("select-partido", (data) => {
          that.partido = data;
          scroll.animateScroll(0);
      });
      this.$on("loaded", (loaded) => {
          that.loadedVis = loaded;
      });
      
      scroll = new SmoothScroll('a[href*="#"]');

  },
  beforeDestroy () {
      window.removeEventListener('scroll', this.onScroll)
  },
  watch: {
      ciclo: function (newVal, oldVal) {
          this.phaserVisuals.scene.scenes[0].events.emit("set-ciclo", newVal);
          scroll.animateScroll(0);
      },
      partido: function (newVal, oldVal) {
          this.phaserVisuals.scene.scenes[0].events.emit("set-partido", newVal);
          scroll.animateScroll(0);
      }
  }
};

</script>

<style>
body {
		padding: 0px;
    margin: 0px;
    padding-top: 60px;
    font-family: 'Rubik', sans-serif;
    scroll-behavior: smooth;
}

.loading-db {
    text-align: center;
    position: absolute;
    width: 100%;
    top: 400px;
    left: 0px;
    z-index: 5;
}

.esconder {
    display: none;
}
a {
    text-decoration: none;
    color: inherit;
}
.ver-mas {
    position: absolute;
    top: 700px;
    width: 100%;
    text-align: center;
    z-index: 3;
}
.ver-mas i.fa {
    color: #ddddcc;
    font-size: 60px;
    opacity: 0.7;
}
.ver-mas a {
    -webkit-box-shadow: 2px 4px 12px 1px rgba(0,0,0,0.3);
    -moz-box-shadow: 2px 4px 12px 1px rgba(0,0,0,0.3);
    box-shadow: 2px 4px 12px 1px rgba(0,0,0,0.3);

}

.header {
    position:fixed;
    top:0px;
    width: 100%;
    z-index:  2;
    background: #ffffdd;
    -webkit-box-shadow: 2px 4px 12px 1px rgba(0,0,0,0.3);
    -moz-box-shadow: 2px 4px 12px 1px rgba(0,0,0,0.3);
    box-shadow: 2px 4px 12px 1px rgba(0,0,0,0.3);
}
.header .inner {
    width: 900px;
    margin: auto;
}

.header .logo {
    height: 70px;
    margin-left: 30px;
    margin-top: 10px;
}

.segunda-parte {
    position:relative;
    z-index: 1;
}

#game-wrapper {
		height: 900px;
}

#game-container, .segunda-parte {
    font-size: 16px;
    font-weight: 300;
    color: #660025;
    width: 900px;
    margin: 0px auto;
    position: relative;
}
#game-container canvas {
    filter: blur(0.80px);
    display: block;
    margin: auto;
    width: 900px;
}

#game-container canvas.sharper {
    filter: blur(0.5px);
}

.nav-breadcrumbs {
    float: right;
    padding: 20px;
    height: 20px;
}

.btn {
    display: inline-block;
    background-color: #c9aa5d;
    color: white;
    padding: 10px 15px;
    margin: 5px;
    font-size: 15px;
    text-transform: uppercase;
    cursor: pointer;
}
.btn.low {
    background: #705104;
}
.top-financistas, .info-partido {
    margin: 0px 5%;
}
.info-partido {
    float: left;
    width: 40%;
}
.partido-img {
    position: relative;
}
.info-partido .partido-logo {
    position: absolute;
    right: 60px;
    bottom: 60px;
    height: 100px;
}

#detalles {
    position: relative; 
    top: -130px;
}
.btn-detalle {
    position: absolute;
    bottom: 20px; 
}
h2 {
    text-transform: uppercase;
}
.info-partido .avatar{
    width: 70%;
    display: block;
    margin: auto;
}

.top-financistas {
    text-align: right;
}
.top-financistas.sel-partido {
    width: 45%;
    margin-left: 50%;
}

.buscador {
    position: relative;
    text-align: right;
    margin-top: 80px;
}


.buscador input {
    width: 50%;
    padding: 11px;
    border: 4px solid #dddddd;
    border-radius: 10px;
    margin-bottom: 20px;
    font-size: 16px;
}

.top-financistas.sel-partido .buscador input {
    width: 100%;
}

.buscador .icono {
    position:absolute;
    font-size: 20px;
    right: 15px;
    top: 15px;
}

.financista {
    padding: 5px 10px;
    font-size: 15px;
    color: #660025;
    max-width: 150px;
    display: inline-block;
    margin: 10px;
    position: relative;
    margin-bottom: 40px;
    min-width: 130px;
    text-transform: uppercase;
}
.financista .partido {
    display: block;
    font-weight: 500;
   /* text-transform: uppercase;*/
    font-size: 12px;
    text-transform: none;
}
.financista .fecha {
    display: block;
    font-style: italic;
    font-size: 14px;
}
.financista .monto {
    bottom: -25px;
    font-size: 13px;
    color: white;
    font-weight: 500;
    padding: 5px 15px;
    background: #b09154;
    border: 3px solid #ddddcc;
    border-radius: 5px;
    position: absolute;
    right: 0px;
}

#listado-top-financistas {
    min-height: 500px;
    height: auto;
}
.vacio {
    font-size: 20px;
    color: #888888;
    padding: 60px 0px;
}
</style>
