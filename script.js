import { nanoid } from 'nanoid';

const profileSchema = {
    username: { type: 'text', label: 'Username', placeholder: 'Your cool username' },
    profilePicture: { type: 'url', label: 'Profile Picture URL', placeholder: 'http://example.com/image.png' },
    interests: {
        books: {
            label: 'Books',
            itemSchema: {
                title: { type: 'text', label: 'Title', placeholder: 'Book Title' },
                author: { type: 'text', label: 'Author', placeholder: 'Author Name' },
                coverUrl: { type: 'url', label: 'Cover URL', placeholder: 'Image URL for book cover' }
            },
        },
        music: {
            label: 'Music',
            itemSchema: {
                title: { type: 'text', label: 'Song/Album Title', placeholder: 'Song or Album' },
                artist: { type: 'text', label: 'Artist', placeholder: 'Artist Name' },
                albumArtUrl: { type: 'url', label: 'Album Art URL', placeholder: 'Image URL for album art' }
            },
        },
        movies: {
            label: 'Movies',
            itemSchema: {
                title: { type: 'text', label: 'Title', placeholder: 'Movie Title' },
                year: { type: 'number', label: 'Year', placeholder: 'Release Year' },
                director: { type: 'text', label: 'Director', placeholder: 'Director Name' },
                posterUrl: { type: 'url', label: 'Poster URL', placeholder: 'Image URL for movie poster' }
            },
        },
        series: {
            label: 'TV Series',
            itemSchema: {
                title: { type: 'text', label: 'Title', placeholder: 'Series Title' },
                year: { type: 'number', label: 'Start Year', placeholder: 'Start Year' },
                network: { type: 'text', label: 'Network/Platform', placeholder: 'e.g., Netflix, HBO' },
                posterUrl: { type: 'url', label: 'Poster URL', placeholder: 'Image URL for series poster' }
            },
        },
        videoGames: {
            label: 'Video Games',
            itemSchema: {
                title: { type: 'text', label: 'Title', placeholder: 'Game Title' },
                platform: { type: 'text', label: 'Platform', placeholder: 'e.g., PC, PS5, Switch' },
                coverUrl: { type: 'url', label: 'Cover Art URL', placeholder: 'Image URL for game cover' }
            },
        },
        hobbies: {
            label: 'Other Interests/Hobbies',
            itemSchema: {
                name: { type: 'text', label: 'Interest/Hobby Name', placeholder: 'e.g., Hiking, Coding' },
                description: { type: 'textarea', label: 'Description', placeholder: 'Tell us more about it' }
            },
        }
    }
};

const USER_PROFILE_KEY = 'userProfileData_v1';
const ALL_USERS_KEY = 'allUsersData_v1';

// SVG Placeholders
const PROFILE_PIC_PLACEHOLDER_SVG = 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><rect width="100%" height="100%" fill="%23dfe3e8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Roboto, sans-serif" font-size="12" fill="%23555c66">No Pic</text></svg>';
const ITEM_IMG_PLACEHOLDER_SVG = 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 4" preserveAspectRatio="xMidYMid slice"><rect width="100%" height="100%" fill="%23e9ecef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Roboto, sans-serif" font-size="0.4" fill="%236c757d">No Preview</text></svg>';

let currentUserProfile;
let allUsers = [];

// Define Example Profiles
const exampleProfiles = [
    {
        id: 'example-user-alice',
        username: 'Alice Wonderland',
        profilePicture: '/alice_avatar.png',
        interests: {
            books: { items: [{ title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", coverUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Alice_in_Wonderland_-_The_Duchess.jpg/800px-Alice_in_Wonderland_-_The_Duchess.jpg" }] },
            music: { items: [{ title: "White Rabbit", artist: "Jefferson Airplane", albumArtUrl: "https://upload.wikimedia.org/wikipedia/en/9/98/JeffersonAirplaneSurrealisticPillow.jpg" }] },
            movies: { items: [] },
            series: { items: [] },
            videoGames: { items: [] },
            hobbies: { items: [{ name: "Tea Parties", description: "Hosting whimsical tea parties with peculiar guests." }] }
        }
    },
    {
        id: 'example-user-bob',
        username: 'Bob The Builder',
        profilePicture: '/bob_avatar.png',
        interests: {
            books: { items: [] },
            music: { items: [] },
            movies: { items: [{ title: "The Lego Movie", year: 2014, director: "Phil Lord, Christopher Miller", posterUrl: "https://upload.wikimedia.org/wikipedia/en/1/10/The_Lego_Movie_poster.jpg" }] },
            series: { items: [] },
            videoGames: { items: [{ title: "Minecraft", platform: "Multi-platform", coverUrl: "https://upload.wikimedia.org/wikipedia/en/5/51/Minecraft_cover.png" }] },
            hobbies: { items: [{ name: "DIY Projects", description: "Building and fixing things around the house." }] }
        }
    },
    {
        id: 'example-user-cosmic',
        username: 'Cosmic Explorer',
        profilePicture: '/cosmic_avatar.png',
        interests: {
            books: { items: [{ title: "A Brief History of Time", author: "Stephen Hawking", coverUrl: "https://upload.wikimedia.org/wikipedia/en/a/a3/BriefHistoryTime.jpg" }] },
            music: { items: [{ title: "Space Oddity", artist: "David Bowie", albumArtUrl: "https://upload.wikimedia.org/wikipedia/en/0/04/Spaceoddity.jpg" }] },
            movies: { items: [] },
            series: { items: [{ title: "Cosmos: A Spacetime Odyssey", year: 2014, network: "Fox/Nat Geo", posterUrl: "https://upload.wikimedia.org/wikipedia/en/5/5e/Cosmos_A_Spacetime_Odyssey_Titlecard.jpg" }] },
            videoGames: { items: [] },
            hobbies: { items: [{ name: "Stargazing", description: "Observing the night sky and contemplating the universe." }] }
        }
    }
];

const navMyProfileBtn = document.getElementById('nav-my-profile');
const navEditProfileBtn = document.getElementById('nav-edit-profile');
const navExploreBtn = document.getElementById('nav-explore');
const saveProfileBtn = document.getElementById('save-profile-button');

const views = {
    myProfile: document.getElementById('my-profile-view'),
    editProfile: document.getElementById('edit-profile-view'),
    explore: document.getElementById('explore-view'),
};
const editProfileFormContainer = document.getElementById('profile-edit-form');
const profileDisplayContent = document.getElementById('profile-display-content');
const userListContainer = document.getElementById('user-list-container');

function showView(viewId) {
    Object.values(views).forEach(view => view.style.display = 'none');
    if (views[viewId]) {
        views[viewId].style.display = 'block';
    }
    
    [navMyProfileBtn, navEditProfileBtn, navExploreBtn].forEach(btn => btn.classList.remove('active'));
    if (viewId === 'myProfile') navMyProfileBtn.classList.add('active');
    else if (viewId === 'editProfile') navEditProfileBtn.classList.add('active');
    else if (viewId === 'explore') navExploreBtn.classList.add('active');
}

function createInputElement(id, fieldSchema) {
    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = fieldSchema.label;

    let input;
    if (fieldSchema.type === 'textarea') {
        input = document.createElement('textarea');
    } else {
        input = document.createElement('input');
        input.type = fieldSchema.type;
    }
    input.id = id;
    input.name = id;
    input.placeholder = fieldSchema.placeholder || '';
    return [label, input];
}

function renderEditProfileView() {
    editProfileFormContainer.innerHTML = ''; // Clear previous form

    // General profile fields
    const generalFieldset = document.createElement('fieldset');
    const generalLegend = document.createElement('legend');
    generalLegend.textContent = 'General Information';
    generalFieldset.appendChild(generalLegend);

    ['username', 'profilePicture'].forEach(key => {
        const [labelEl, inputEl] = createInputElement(key, profileSchema[key]);
        inputEl.value = currentUserProfile[key] || '';
        generalFieldset.appendChild(labelEl);
        generalFieldset.appendChild(inputEl);
    });
    editProfileFormContainer.appendChild(generalFieldset);

    // Interest categories
    for (const categoryKey in profileSchema.interests) {
        const category = profileSchema.interests[categoryKey];
        const categoryData = currentUserProfile.interests[categoryKey];

        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = category.label;
        fieldset.appendChild(legend);

        const itemsListDiv = document.createElement('div');
        itemsListDiv.className = 'items-list';
        categoryData.items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item-entry';
            
            const itemTextSpan = document.createElement('span'); // For text content
            let itemSummary = Object.values(item).filter(val => typeof val === 'string' && val.trim() !== '').slice(0,2).join(' - ');
            if(itemSummary.length > 60) itemSummary = itemSummary.substring(0, 57) + "...";
            itemTextSpan.textContent = itemSummary || 'Item (no details)';
            itemDiv.appendChild(itemTextSpan);
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.className = 'remove-item-btn';
            removeBtn.type = 'button';
            removeBtn.onclick = () => {
                categoryData.items.splice(index, 1);
                renderEditProfileView(); // Re-render to update list and indices
            };
            itemDiv.appendChild(removeBtn);
            itemsListDiv.appendChild(itemDiv);
        });
        fieldset.appendChild(itemsListDiv);

        const addItemFormDiv = document.createElement('div');
        addItemFormDiv.className = 'add-item-form';
        const addItemHeader = document.createElement('h4');
        addItemHeader.textContent = `Add New ${category.label.slice(0, -1)}`; // "Books" -> "Book"
        addItemFormDiv.appendChild(addItemHeader);

        const itemInputs = {};
        for (const fieldKey in category.itemSchema) {
            const field = category.itemSchema[fieldKey];
            const inputId = `${categoryKey}-${fieldKey}-input`;
            const [labelEl, inputEl] = createInputElement(inputId, field);
            itemInputs[fieldKey] = inputEl;
            addItemFormDiv.appendChild(labelEl);
            addItemFormDiv.appendChild(inputEl);
        }

        const addItemBtn = document.createElement('button');
        addItemBtn.textContent = `Add ${category.label.slice(0, -1)}`;
        addItemBtn.className = 'add-item-btn';
        addItemBtn.type = 'button';
        addItemBtn.onclick = () => {
            const newItem = {};
            let hasValue = false;
            for (const fieldKey in itemInputs) {
                newItem[fieldKey] = itemInputs[fieldKey].value;
                if(itemInputs[fieldKey].value.trim() !== '') hasValue = true;
                itemInputs[fieldKey].value = ''; // Clear input after adding
            }
            if (hasValue) {
                categoryData.items.push(newItem);
                renderEditProfileView(); // Re-render to show new item and clear form for category
            } else {
                alert("Please fill at least one field for the item.");
            }
        };
        addItemFormDiv.appendChild(addItemBtn);
        fieldset.appendChild(addItemFormDiv);
        editProfileFormContainer.appendChild(fieldset);
    }
}

function isLikelyImageURL(url) {
    if (typeof url !== 'string') return false;
    // Added webp to the regex
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
}

function renderMyProfileView(profileToView) {
    profileDisplayContent.innerHTML = ''; // Clear previous content

    if (!profileToView || !profileToView.username) {
        profileDisplayContent.innerHTML = '<p class="placeholder-text">No profile data to display. Try editing your profile or select a user from Explore!</p>';
        return;
    }
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'profile-header';
    
    const profileImg = document.createElement('img');
    profileImg.alt = `${profileToView.username || 'User'}'s profile picture`;
    if (profileToView.profilePicture) {
        profileImg.src = profileToView.profilePicture;
        profileImg.onerror = () => { profileImg.src = PROFILE_PIC_PLACEHOLDER_SVG; };
    } else {
        profileImg.src = PROFILE_PIC_PLACEHOLDER_SVG;
    }
    headerDiv.appendChild(profileImg);
    
    const usernameEl = document.createElement('h2');
    usernameEl.textContent = profileToView.username || 'Unnamed User';
    headerDiv.appendChild(usernameEl);

    profileDisplayContent.appendChild(headerDiv);

    for (const categoryKey in profileToView.interests) {
        const category = profileSchema.interests[categoryKey];
        const categoryData = profileToView.interests[categoryKey];

        if (categoryData.items && categoryData.items.length > 0) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'interest-category';
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = category.label;
            categoryDiv.appendChild(categoryTitle);

            categoryData.items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'item-entry';

                const itemDetailsDiv = document.createElement('div');
                itemDetailsDiv.className = 'item-details';

                let primaryImageUrl = null;
                let primaryImageAltText = item.title || item.name || category.label + ' item';
                let primaryImageUrlFieldKey = null;

                // Attempt to find a primary image URL from common field names or any URL field
                const commonImageFieldKeys = ['coverUrl', 'posterUrl', 'albumArtUrl', 'imageUrl', 'imageURL'];
                for (const key of commonImageFieldKeys) {
                    if (category.itemSchema[key] && item[key] && isLikelyImageURL(item[key])) {
                        primaryImageUrl = item[key];
                        primaryImageUrlFieldKey = key;
                        break;
                    }
                }
                if (!primaryImageUrl) {
                    for (const fieldKey in category.itemSchema) {
                        if (category.itemSchema[fieldKey].type === 'url' && item[fieldKey] && isLikelyImageURL(item[fieldKey])) {
                            primaryImageUrl = item[fieldKey];
                            primaryImageUrlFieldKey = fieldKey;
                            break;
                        }
                    }
                }

                if (primaryImageUrl) {
                    const itemImageContainerDiv = document.createElement('div');
                    itemImageContainerDiv.className = 'item-image-container';
                    const img = document.createElement('img');
                    img.className = 'item-content-image'; // Added class for specific styling
                    img.src = primaryImageUrl;
                    img.alt = primaryImageAltText;
                    img.onerror = () => { img.src = ITEM_IMG_PLACEHOLDER_SVG; };
                    itemImageContainerDiv.appendChild(img);
                    itemDiv.appendChild(itemImageContainerDiv);
                } else {
                    itemDiv.classList.add('no-image');
                }
                
                // Populate item details
                for (const fieldKey in category.itemSchema) {
                    if (item[fieldKey]) {
                        // Skip re-listing the primary image URL if it was displayed as an image
                        if (fieldKey === primaryImageUrlFieldKey && primaryImageUrl) {
                            continue;
                        }

                        const p = document.createElement('p');
                        const strong = document.createElement('strong');
                        strong.textContent = `${category.itemSchema[fieldKey].label}: `;
                        p.appendChild(strong);
                        
                        if (category.itemSchema[fieldKey].type === 'url') {
                            const a = document.createElement('a');
                            a.href = item[fieldKey];
                            // Display a shorter text if it's an image URL, otherwise the URL itself
                            a.textContent = isLikelyImageURL(item[fieldKey]) ? (item.title || item.name || "View Image") : item[fieldKey];
                            a.target = "_blank";
                            p.appendChild(a);
                        } else {
                             p.appendChild(document.createTextNode(item[fieldKey]));
                        }
                        itemDetailsDiv.appendChild(p);
                    }
                }
                itemDiv.appendChild(itemDetailsDiv);
                categoryDiv.appendChild(itemDiv);
            });
            profileDisplayContent.appendChild(categoryDiv);
        }
    }
}

function renderExploreView() {
    userListContainer.innerHTML = '';
    if (allUsers.length === 0 || allUsers.every(user => !user || !user.username)) {
        userListContainer.innerHTML = '<p class="placeholder-text">No other users to explore yet. Save your profile to appear here!</p>';
        return;
    }

    allUsers.forEach(user => {
        if (!user || !user.username) return; 
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        
        const img = document.createElement('img');
        img.alt = user.username || 'User';
        if (user.profilePicture) {
            img.src = user.profilePicture;
            img.onerror = () => { img.src = PROFILE_PIC_PLACEHOLDER_SVG; };
        } else {
            img.src = PROFILE_PIC_PLACEHOLDER_SVG;
        }
        userCard.appendChild(img);

        const userNameSpan = document.createElement('span');
        userNameSpan.textContent = user.username;
        userCard.appendChild(userNameSpan);

        userCard.onclick = () => {
            // Pass a deep copy of the user profile to avoid modification issues
            // if the user object from allUsers is directly manipulated elsewhere.
            renderMyProfileView(JSON.parse(JSON.stringify(user)));
            showView('myProfile');
        };
        userListContainer.appendChild(userCard);
    });
}

function saveProfile() {
    // Update currentUserProfile from form fields
    currentUserProfile.username = document.getElementById('username').value;
    currentUserProfile.profilePicture = document.getElementById('profilePicture').value;
    // Interest items are already updated in currentUserProfile.interests by their respective add/remove handlers

    if (!currentUserProfile.id) {
        currentUserProfile.id = nanoid(); 
        console.warn("currentUserProfile.id was not set, assigned new one:", currentUserProfile.id);
    }

    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(currentUserProfile));

    const userIndex = allUsers.findIndex(u => u.id === currentUserProfile.id);
    const profileCopy = JSON.parse(JSON.stringify(currentUserProfile)); // Deep copy for storage

    if (userIndex > -1) {
        allUsers[userIndex] = profileCopy; 
    } else {
        // Only add to allUsers if username is present
        if (profileCopy.username && profileCopy.username.trim() !== '') {
            allUsers.push(profileCopy);
        }
    }
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(allUsers.filter(u => u && u.username && u.username.trim() !== ''))); // Filter out invalid entries before saving

    alert('Profile saved!');
    renderMyProfileView(currentUserProfile);
    showView('myProfile');
}

function loadData() {
    const storedProfile = localStorage.getItem(USER_PROFILE_KEY);
    if (storedProfile) {
        currentUserProfile = JSON.parse(storedProfile);
    } else {
        currentUserProfile = {
            id: nanoid(), 
            username: '',
            profilePicture: '',
            interests: {}
        };
    }
    if (!currentUserProfile.id) {
        currentUserProfile.id = nanoid();
    }

    for (const categoryKey in profileSchema.interests) {
        if (!currentUserProfile.interests[categoryKey]) {
            currentUserProfile.interests[categoryKey] = { items: [] };
        } else if (!currentUserProfile.interests[categoryKey].items) { 
             currentUserProfile.interests[categoryKey].items = [];
        }
    }

    const storedAllUsers = localStorage.getItem(ALL_USERS_KEY);
    let tempAllUsers = [];
    if (storedAllUsers) {
        try {
            tempAllUsers = JSON.parse(storedAllUsers);
            if (!Array.isArray(tempAllUsers)) tempAllUsers = []; // Ensure it's an array
        } catch (e) {
            console.error("Error parsing allUsers from localStorage", e);
            tempAllUsers = [];
        }
    }
    
    // Filter out any malformed user entries (e.g., null or without id/username)
    allUsers = tempAllUsers.filter(u => u && u.id && u.username && u.username.trim() !== '');


    let examplesAddedOrUpdated = false;
    exampleProfiles.forEach(exampleUser => {
        for (const categoryKey in profileSchema.interests) {
            if (!exampleUser.interests[categoryKey]) {
                exampleUser.interests[categoryKey] = { items: [] };
            }
        }
        const existingExampleUserIndex = allUsers.findIndex(u => u.id === exampleUser.id);
        if (existingExampleUserIndex === -1) {
            allUsers.push(JSON.parse(JSON.stringify(exampleUser))); 
            examplesAddedOrUpdated = true;
        } else {
            // Optional: update example user if it differs (e.g. schema changes)
            // For now, just ensure it exists.
            // allUsers[existingExampleUserIndex] = JSON.parse(JSON.stringify(exampleUser));
        }
    });


    if (currentUserProfile && currentUserProfile.username && currentUserProfile.username.trim() !== '' && currentUserProfile.id) {
        const currentUserInAllUsersIndex = allUsers.findIndex(u => u.id === currentUserProfile.id);
        if (currentUserInAllUsersIndex === -1) {
            allUsers.push(JSON.parse(JSON.stringify(currentUserProfile)));
            examplesAddedOrUpdated = true; 
        } else {
            // Update if current user's profile in allUsers is different from their local storage one
            if (JSON.stringify(allUsers[currentUserInAllUsersIndex]) !== JSON.stringify(currentUserProfile)) {
                 allUsers[currentUserInAllUsersIndex] = JSON.parse(JSON.stringify(currentUserProfile));
                 examplesAddedOrUpdated = true;
            }
        }
    }

    if (examplesAddedOrUpdated) {
        localStorage.setItem(ALL_USERS_KEY, JSON.stringify(allUsers.filter(u => u && u.username && u.username.trim() !== '')));
    }
}

function init() {
    loadData();

    navMyProfileBtn.onclick = () => {
        renderMyProfileView(currentUserProfile);
        showView('myProfile');
    };
    navEditProfileBtn.onclick = () => {
        renderEditProfileView();
        showView('editProfile');
    };
    navExploreBtn.onclick = () => {
        renderExploreView();
        showView('explore');
    };
    saveProfileBtn.onclick = saveProfile;

    if (currentUserProfile && currentUserProfile.username && currentUserProfile.username.trim() !== '') {
        renderMyProfileView(currentUserProfile);
        showView('myProfile');
    } else {
        renderEditProfileView();
        showView('editProfile');
    }
}

window.addEventListener('DOMContentLoaded', init);