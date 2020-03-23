<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class SlotFactory extends Vue {
  public render(h: Vue.CreateElement): Vue.VNode {
    return h(
      "slot", 
      {}, 
      []
    );
  }
}
</script>