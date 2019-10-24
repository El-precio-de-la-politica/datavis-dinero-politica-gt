<template>
  <div id="main-container">
      <div id="game-container"></div>
  </div>
</template>

<script>
import Vue from 'vue'

import * as dinero from './datavis-dinero'

export default {
  components: {
  },
  data() {
    return {
      content: {
      }
    };
  },
  methods: {
  },
  async mounted() {
    this.$nextTick(() => dinero.loader())
  }
};
</script>

<style>
#app {
  font-size: 18px;
  font-family: 'Roboto', sans-serif;
  color: #38c;
}
#game-container canvas {
    filter: blur(0.5px);
    display: block;
    margin: auto;
}

</style>
