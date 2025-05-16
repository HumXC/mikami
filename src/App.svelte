<script lang="ts">
    import "@humxc/mikami";
    import Router from "svelte-spa-router";
    import routes from "./routes";
</script>

<main>
    <Router {routes} />
</main>

<style>
    main {
        height: 100vh;
        width: 100vw;
        background-color: transparent;
    }
</style>
