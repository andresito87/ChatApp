<script lang="ts">
  import { onMount } from "svelte";
  import axios from "axios";
  import { API_HOST } from "../constants";
  import "../styles/chatDetails.css";
  import { _, locale } from "svelte-i18n";

  // Stores the chat id that is currently selected, received as a prop
  export let chatId: string;

  // Stores the list of messages
  let messages: { message: string; createdAt: number }[] = [];

  // variable bound to the textarea to store the new message
  let newMessage = "";

  // Stores the error message if any
  let errorMessage: string | null = null;

  // Stores the loading state, blocking or unblocking the send button
  let isLoading = false;

  // Fetches the list of messages from the server on component mount, firt time is rendered
  onMount(async () => {
    await loadMessages();
  });
  async function loadMessages() {
    try {
      const response = await axios.get(
        `${API_HOST}/api/v1/chat/${chatId}/message/`,
      );
      messages = response.data.data;
    } catch (error) {
      errorMessage = "Failed to get chat details. Please try again later.";
      console.error("Error fetching messages:", error);
    }
  }

  // Sends a new message to the server
  async function sendMessage() {
    isLoading = true;
    try {
      const response = await axios.post(
        `${API_HOST}/api/v1/chat/${chatId}/message/`,
        { message: newMessage },
      );
      messages = [
        ...messages,
        { message: newMessage, createdAt: Date.now() },
        response.data.data,
      ];
      newMessage = "";
    } catch (error) {
      errorMessage = "Failed to send message. Please try again later.";
      console.error("Error sending message:", error);
    }
    isLoading = false;
  }

  // Reloads the messages when the chatId changes, reactive variable
  $: {
    if (chatId) {
      loadMessages();
    }
  }
</script>

<div class="chat-details-wrapper">
  {#if errorMessage}
    <div class="error">{errorMessage}</div>
  {/if}
  <ul>
    {#each messages as message}
      <li>
        {message.message}
        <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
      </li>
    {/each}
  </ul>
  <textarea bind:value={newMessage} placeholder="Type a message"></textarea>
  <button on:click={sendMessage} disabled={isLoading}>
    {#if isLoading}
    {$_("Sending")}
    {:else}
    {$_("Send")}
    {/if}
  </button>
</div>
