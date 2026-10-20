import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const user1 = {
  email: "suneeth0808@gmail.com",
  password: "SAI@@0808",
  username: "suneeth0808",
  displayName: "Suneeth",
  bio: "Passionate about space exploration and orbital dynamics.",
  location: "Bangalore, India",
  website: "https://galaxyground.test",
  avatarUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=150&h=150&q=80",
};

const user2 = {
  email: "manideeppasupula5@gmail.com",
  password: "Mani@0852",
  username: "manideeppasupula5",
  displayName: "Manideep",
  bio: "Astrobiology researcher studying life limits in extreme conditions.",
  location: "Hyderabad, India",
  website: "https://galaxyground.test",
  avatarUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=150&h=150&q=80",
};

test("1. Update profile and create post for User 1", async ({ page }) => {
  test.setTimeout(90000);
  
  // Navigate to auth and login
  await page.goto("/auth");
  await page.fill('input[type="email"]', user1.email);
  await page.fill('input[type="password"]', user1.password);
  await page.click('button[type="submit"]');

  // Verify redirected to homepage feed
  await expect(page).toHaveURL("/");
  await page.waitForTimeout(3000);

  // Navigate to profile
  await page.goto("/profile");
  await page.waitForTimeout(3000);

  // Click Edit
  await page.click('button:has-text("Edit")');
  await page.fill('input[placeholder="Display name"]', user1.displayName);
  await page.fill('input[placeholder="Username"]', user1.username);
  await page.fill('textarea[placeholder="Bio"]', user1.bio);
  await page.fill('input[placeholder="Location"]', user1.location);
  await page.fill('input[placeholder="Website"]', user1.website);
  await page.fill('input[placeholder="Avatar image URL"]', user1.avatarUrl);
  await page.click('button:has-text("Save")');

  // Wait for success toast/indicator
  await page.waitForTimeout(4000);

  // Create post
  await page.goto("/");
  await page.fill('textarea[placeholder*="Share something about space"]', "Hello cosmos! #space #universe");
  await page.click('button:has-text("Post")');
  await page.waitForTimeout(4000);

  // Sign out
  await page.goto("/profile");
  await page.click('button:has-text("Sign out")');
  await page.waitForTimeout(3000);
});

test("2. Update profile and create post for User 2", async ({ page }) => {
  test.setTimeout(90000);

  // Navigate to auth and login
  await page.goto("/auth");
  await page.fill('input[type="email"]', user2.email);
  await page.fill('input[type="password"]', user2.password);
  await page.click('button[type="submit"]');

  // Verify redirected to homepage feed
  await expect(page).toHaveURL("/");
  await page.waitForTimeout(3000);

  // Navigate to profile
  await page.goto("/profile");
  await page.waitForTimeout(3000);

  // Click Edit
  await page.click('button:has-text("Edit")');
  await page.fill('input[placeholder="Display name"]', user2.displayName);
  await page.fill('input[placeholder="Username"]', user2.username);
  await page.fill('textarea[placeholder="Bio"]', user2.bio);
  await page.fill('input[placeholder="Location"]', user2.location);
  await page.fill('input[placeholder="Website"]', user2.website);
  await page.fill('input[placeholder="Avatar image URL"]', user2.avatarUrl);
  await page.click('button:has-text("Save")');

  // Wait for success toast/indicator
  await page.waitForTimeout(4000);

  // Create post
  await page.goto("/");
  await page.fill('textarea[placeholder*="Share something about space"]', "Researching exobiology limits today! #science #astrobiology");
  await page.click('button:has-text("Post")');
  await page.waitForTimeout(4000);

  // Sign out
  await page.goto("/profile");
  await page.click('button:has-text("Sign out")');
  await page.waitForTimeout(3000);
});

test("3. Send connection request or open chat from User 1 to User 2", async ({ page }) => {
  test.setTimeout(90000);

  // Log in as User 1
  await page.goto("/auth");
  await page.fill('input[type="email"]', user1.email);
  await page.fill('input[type="password"]', user1.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Search for User 2
  const searchInput = page.locator('input[placeholder*="Search posts, users"]');
  await searchInput.fill(user2.displayName);
  await page.waitForTimeout(3000); // wait for search results

  // Click on User 2's profile in search results
  await page.click(`a:has-text("${user2.displayName}")`);
  await page.waitForTimeout(3000);

  // Check the button state
  const messageButton = page.locator('button:has-text("Message")');
  const connectButton = page.locator('button:has-text("Connect")');
  const pendingButton = page.locator('button:has-text("Pending Approval")');

  if (await messageButton.isVisible()) {
    console.log("Already connected! Opening message thread...");
    await messageButton.click();
    await page.waitForTimeout(3000);
    // Send a message to keep conversation going
    await page.fill('textarea[placeholder="Type your message..."]', "Hi again! Let's follow up on our exoplanet discussion.");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  } else if (await pendingButton.isVisible()) {
    console.log("Connection request is already pending approval.");
  } else if (await connectButton.isVisible()) {
    console.log("No connection found. Sending new connection request...");
    await connectButton.click();
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Collaboration")');
    await page.fill('textarea#context-message', "Hi! I am interested in collaborating on space biology and exoplanets.");
    await page.click('button:has-text("Send Request")');
    await page.waitForTimeout(4000);
  } else {
    throw new Error("Could not find any Connect/Message/Pending button on profile.");
  }

  // Sign out
  await page.goto("/profile");
  await page.click('button:has-text("Sign out")');
  await page.waitForTimeout(3000);
});

test("4. Accept connection request (if pending) and send message as User 2", async ({ page }) => {
  test.setTimeout(90000);

  // Log in as User 2
  await page.goto("/auth");
  await page.fill('input[type="email"]', user2.email);
  await page.fill('input[type="password"]', user2.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Go to messages
  await page.goto("/messages");
  await page.waitForTimeout(3000);

  // Check if thread with User 1 exists in the Chats list
  const threadSelector = page.locator(`button:has-text("${user1.displayName}")`);
  const requestsTab = page.locator('button:has-text("Requests")');

  if (await threadSelector.isVisible()) {
    console.log("Chat thread already active. Opening thread...");
    await threadSelector.click();
    await page.waitForTimeout(2000);
  } else {
    console.log("No active thread. Checking Requests tab...");
    await requestsTab.click();
    await page.waitForTimeout(2000);

    const acceptButton = page.locator('button:has-text("Accept")');
    if (await acceptButton.isVisible()) {
      await acceptButton.click();
      await page.waitForTimeout(4000);
      
      // Go back to Chats tab
      await page.click('button:has-text("Chats")');
      await page.waitForTimeout(2000);
      await page.click(`button:has-text("${user1.displayName}")`);
      await page.waitForTimeout(2000);
    } else {
      console.log("No pending requests found. They might have been processed already.");
      // Just check if we can navigate to User 1's profile and message them
      await page.goto("/profile");
      const searchInput = page.locator('input[placeholder*="Search posts, users"]');
      await searchInput.fill(user1.displayName);
      await page.waitForTimeout(3000);
      await page.click(`a:has-text("${user1.displayName}")`);
      await page.waitForTimeout(3000);
      
      const messageBtn = page.locator('button:has-text("Message")');
      await expect(messageBtn).toBeVisible();
      await messageBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  // Send message
  await page.fill('textarea[placeholder="Type your message..."]', "Thanks for connecting! I would love to talk about exoplanet research.");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  // Sign out
  await page.goto("/profile");
  await page.click('button:has-text("Sign out")');
  await page.waitForTimeout(3000);
});

test("5. Receive message as User 1 and reply", async ({ page }) => {
  test.setTimeout(90000);

  // Log in as User 1
  await page.goto("/auth");
  await page.fill('input[type="email"]', user1.email);
  await page.fill('input[type="password"]', user1.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Go to messages
  await page.goto("/messages");
  await page.waitForTimeout(3000);

  // Click on the conversation with User 2
  await page.click(`button:has-text("${user2.displayName}")`);
  await page.waitForTimeout(3000);

  // Verify message is received
  await expect(page.locator('body')).toContainText("talk about exoplanet research");

  // Reply
  await page.fill('textarea[placeholder="Type your message..."]', "Great! Let's schedule a call sometime soon.");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
});
