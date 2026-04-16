# Chinese Vocab Flashcards

A lightweight browser app for studying Chinese vocabulary with flashcards.

## Features

- Front of card shows Hanzi.
- Back of card shows pinyin with tone marks and the English translation.
- Import vocabulary from a CSV file or by pasting CSV text.
- Save the current deck in browser storage.
- Shuffle, flip, browse, and export your deck.

## CSV Format

Use a header row with these columns:

```csv
hanzi,pinyin,english
你好,nǐ hǎo,hello
学生,xué sheng,student
老师,lǎo shī,teacher
```

The importer also accepts some header aliases:

- `hanzi`: `chinese`, `simplified`, `traditional`
- `pinyin`: `pronunciation`, `romanization`
- `english`: `translation`, `meaning`, `definition`

## Run It

Because this app has no dependencies, you can open `index.html` directly in a browser.

If you prefer serving it locally, run:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Sample Deck

Try importing `sample-vocab.csv` to test the app quickly.
