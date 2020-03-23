<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <div class="slot-wrapper">
      <IsomorphicSlot />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import IsomorphicSlot from "./IsomorphicSlot.vue";

@Component({
  components: {
    IsomorphicSlot
  }
})
export default class HelloWorld extends Vue {
  @Prop() private msg!: string;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.slot-wrapper {
  padding: 5ex;
  margin: 2ex;
  background: gold;
}
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
