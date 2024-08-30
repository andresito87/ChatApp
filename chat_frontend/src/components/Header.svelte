<script lang="ts">
  import { navigate } from "svelte-routing";
  import { authToken } from "../stores/auth";
  import "../styles/header.css";
  import { _, locale } from "svelte-i18n";

  // Get the user's name from the token
  const name = authToken.getPayload()?.name || "User";

  // Remove the token from the store and redirect to login page
  function logout() {
    authToken.remove();
    navigate("/login");
  }
</script>

<div class="header">
  <div class="user-name">{name}</div>
  <div class="locale">
    <select bind:value={$locale}>
      <option value="en-US" selected={ $locale === 'en-US' }>English</option>
      <option value="es-ES" selected={ $locale === 'es-ES' }>Spanish</option>
    </select>
  </div>
  <button class="logout-button" on:click={logout}>{$_("logout")}</button>
</div>
