import Vue from "vue";
import HelloWorld from "./HelloWorld.vue";
import Forest from "../forestjs";

Vue.use(Forest);

export default Vue.isoComponent('happy-rainbow', HelloWorld);