function readBook(bookId) {
    if (!checkAuth()) return;
    window.location.href = `read-book.html?id=${bookId}`;
}
