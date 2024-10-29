function submitAddBookForm(formID, url) {
    const form = document.getElementById(formID); // Access the form by its ID
    form.addEventListener('submit', async function (event) { // This function is triggered upon form submission
        event.preventDefault(); // Prevents page from reloading

        const formData = new FormData(); // This will hold the input values
        formData.append('title', document.getElementById('bookTitle').value);
        formData.append('author', document.getElementById('authorName').value);
        formData.append('pub_date', document.getElementById('pub_date').value);

        try {
            // Send the form data to the backend API route using fetch
            const response = await fetch(url, {
                method: 'POST',
                body: formData // Contains all input values
            });

            const result = await response.text(); // Handle the response (you could parse JSON if needed)

            // Checks whether the book was added or not
            if (response.ok) {
                alert('Book added successfully!');
            } else {
                alert('Error adding book: ' + result);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while adding the book');
        }
    });
}
