<script>
  // Estado local del contador de ejemplo.
  let count = $state(0);
</script>

<!-- Boton que suma uno al contador cada vez que se pulsa. -->
<button class="counter" onclick={() => count++}>Count is {count}</button>
