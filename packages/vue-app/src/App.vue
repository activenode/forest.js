<template>
  <div>
    <div class="app rainbow-1">
      <Rainbow msg="Hello I am Rainbow 1">
        <strong>I am a plain rainbow child</strong>
      </Rainbow>
    </div>

    <div class="app rainbow-2">
      <Rainbow msg="I am Rainbow 2 without children" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Rainbow from "./components/Rainbow";

@Component({
  components: {
    Rainbow
  }
})
export default class App extends Vue {}
</script>

<style>
.app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
