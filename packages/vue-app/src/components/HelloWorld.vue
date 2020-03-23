<template>
  <div class="hello">
    <h1>{{ msg }} 123</h1>
    <div class="slot-wrapper">
      <SlotFactory />
    </div>
  </div>
</template>

<docs>
  test
</docs>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import SlotFactory from "./SlotFactory.vue";

@Component({
  components: {
    SlotFactory
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
