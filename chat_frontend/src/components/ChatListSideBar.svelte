<script lang="ts">
  import { onMount } from "svelte";
  import axios from "axios";
  import { navigate } from "svelte-routing";
  import CreateChatPopup from "./CreateChatPopup.svelte";
  import { API_HOST } from "../constants";
  import "../styles/chatList.css";
  import { _, locale } from "svelte-i18n";

  // Stores the list of chats
  let chats: { id: string; name: string }[] = [];

  // Stores the error message if any
  let errorMessage: string | null = null;

  // Stores the chat id that is currently selected, received as a prop
  export let chatId: string | null;

  // Fetches the list of chats from the server
  async function getData() {
    try {
      const response = await axios.get(`${API_HOST}/api/v1/chat/`);
      chats = response.data.data;
    } catch (error) {
      console.error("Error fetching chats:", error);
      errorMessage = "Failed to fetch chats. Please try again later.";
    }
  }

  // Fetch the list of chats when the component is mounted
  onMount(async () => {
    await getData();
  });

  // Determines if the create chat popup should be displayed
  let isCreatingNewChat = false;

  // Navigates to the chat with the given id
  function selectChat(chatId: string) {
    navigate(`/${chatId}`);
  }

  // Sets the flag to display the create chat popup
  function createNewChat() {
    isCreatingNewChat = true;
  }

  // Called when a new chat is created
  async function onCreate(newChatId: string) {
    onClose();
    navigate(`/${newChatId}`);
    await getData();
  }

  // Called when the create chat popup is closed
  function onClose() {
    isCreatingNewChat = false;
  }
</script>

<div class="chat-list-container">
  {#if errorMessage}
    <div class="error">{errorMessage}</div>
  {/if}
  {#if isCreatingNewChat}
    <CreateChatPopup {onCreate} {onClose} />
  {/if}
  {#if chats.length === 0}
    <div class="no-chats">No chats available. Create a new one!</div>
  {/if}
  <div class="chat-list">
    {#each chats as chat (chat.id)}
      <div
        class="chat-list-item"
        class:selected={chat.id === chatId}
        on:click={() => selectChat(chat.id)}
        on:keydown|preventDefault={(event) =>
          event.key === "Enter" && selectChat(chat.id)}
        tabindex="0"
        role="button"
      >
        {chat.name}
      </div>
    {/each}
  </div>
  <button on:click={() => createNewChat()}>{$_("New Chat")}</button>
</div>
