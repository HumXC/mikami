<script lang="ts">
    import Router from "svelte-spa-router";
    import routes from "./routes";
</script>

<main>
    <Router {routes} />
</main>

<style>
    main {
        width: 100vw;
        background-color: transparent;
    }
</style>
