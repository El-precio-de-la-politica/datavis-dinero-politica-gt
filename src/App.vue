<template>
  <div id="main-container">
      <div class="nav-breadcrumbs">
          <span class="btn low select-msg" v-if="ciclo != null" @click="resetSels()">Volver </span>
          <span class="btn select-msg" v-if="ciclo == null">Selecciona un año</span>
          <span class="btn low select-msg" v-if="ciclo != null" @click="partido = null">Elecciones {{ciclo}} </span>
          <span class="btn select-msg" v-if="ciclo != null && partido == null">Selecciona un partido</span>
          <span class="btn low"  v-if="partido != null">{{partido}}</span>
      
      </div>
      <div id="game-container"></div>
      
      <div class="segunda-parte">
          <div v-if="partido" class="info-partido">
              <h2>{{partido}}</h2>
              <div class="partido-img">
                  <img class="avatar" :src="partidoImg" >
              </div>
          </div>
          <div :class="{ 'top-financistas': true, 'sel-partido': partido!=null}">
              <h2>MAYORES FINANCISTAS</h2>
              <input class="buscador" v-model="filtroTop" placeholder="BUSCAR" />
              <div id="listad-top-financistas"> 
                  <div class="financista" v-for="financista in topFinancistas">
                      {{financista[5]}} <span class="monto">Q {{abbrevMoney(financista[3])}}</span>
                      <span v-if="partido==null"  class="partido">{{financista[4]}}</span>
                      <span   class="fecha">{{financista[1].substr(0,10) || parseInt(financista[2])}}</span>
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>

<script>
import Vue from 'vue'
import Papa from "papaparse"

import * as dinero from './datavis-dinero'

export default {
  components: {
  },
  data() {
    return {
      content: {
      },
      filtroTop: "",
      database: [],
      partido: null,
      ciclo: null
    };
  },
  methods: {
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
      }
  },
  computed: {
      partidoImg () {
          var imagenes = {
              2007: {
                  "UNE": "",
                  "Patriota": "assets/Avatars/OttoPerez-01.png"
              },
              2011: {
                  "Patriota": "assets/Avatars/OttoPerez-01.png", 
                  "Lider": "assets/Avatars/ManuelBaldizon-01.png" 
              },
              2015: {
                  "FCN": "assets/Avatars/JimmyMorales-01.png",
                  "UNE": "assets/Avatars/SandraTorres-01.png" ,
                  "Lider": "assets/Avatars/ManuelBaldizon-01.png" 
              }
          };
          
          return imagenes[this.ciclo][this.partido];
      },
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
              console.log(filtro);
              processedData = processedData.filter((i)=> {
                  return +i[2] == +filtro;
              });
          }
          
          if (this.partido!=null) {
              var filtro = this.partido;
              console.log(filtro);
              processedData = processedData.filter((i)=> {
                  return i[4] == filtro;
              });
          }
          
          
          return processedData.slice(0,40);
      }
  },

  async mounted() {
      var that = this;
      var database = Papa.parse("gte_financiamiento.csv", {
            download: true,
            complete: function (results, file) {
                results.data = results.data.filter((i) => {
                    return i[3] > 0;
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
      });
      this.$on("select-partido", (data) => {
          that.partido = data;
      });
  },
  
  watch: {
      ciclo: function (newVal, oldVal) {
          this.phaserVisuals.scene.scenes[0].events.emit("set-ciclo", newVal);
      },
      partido: function (newVal, oldVal) {
          this.phaserVisuals.scene.scenes[0].events.emit("set-partido", newVal);
      }
  }
};

</script>

<style>
#main-container {
  font-size: 16px;
  font-weight: 300;
  font-family: 'Rubik', sans-serif;
  color: #660025;
  width: 1000px;
  margin: 0px auto;
  position: relative;
}
#game-container canvas {
    filter: blur(0.5px);
    display: block;
    margin: auto;
}

.nav-breadcrumbs {
    position: fixed;
    z-index: 2;
    top: 20px;
    left: 0px;
    text-align: center;
    width: 100%;
}

.btn {
    display: inline-block;
    background-color: #c9aa5d;
    color: white;
    padding: 10px 15px;
    margin: 5px;
    font-size: 19px;
    text-transform: uppercase;
}
.btn.low {
    background: #705104;
}

.info-partido {
    float: left;
    width: 48%;
    
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
    width: 50%;
    margin-left: 50%;
}
.buscador {
    width: 50%;
    padding: 10px;
    border: 1px solid #aaaaaa;
    border-radius: 10px;
    margin-bottom: 20px;
}

.financista {
    padding: 5px 10px;
    font-size: 15px;
    color: #660025;
    max-width: 180px;
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
    text-transform: uppercase;
    font-size: 12px;
}
.financista .fecha {
    display: block;
    font-style: italic;
    font-size: 10px;
}
.financista .monto {
    bottom: -25px;
    font-size: 13px;
    color: white;
    font-weight: 500;
    padding: 3px 10px;
    background: #555555;
    border: 1px solid black;
    border-radius: 5px;
    position: absolute;
    right: 0px;
}
</style>
