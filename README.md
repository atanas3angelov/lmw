# lmw
Learn More Words - learn the grammar on Duolingo; customize the vocabulary you want to learn here

purpose: to help one learn more words  
The app is designed to work locally (localhost) through the default developer Django built-in server.  

run app by typing (in project's lmw dir containing manage.py):  
- python manage.py runserver  
open localhost:8000/dictionary in browser

programming language: Python + Django - see requirements.txt  
react - see package.json  
IDE: PyCharm Community, VSCode  

Target OS: Windows  

The functionality can be separated into 2 main parts:
- dictionary (add, view, edit words in dictionary)  
- practice (set up a practice session and practice)  

If fixed amount of words is selected in practice setup, the react frontend is activated.  
If unlimited words is selected in practice setup, everything happens in the backend (with django's templating language).  

screenshots of main functionality:
  1. main menu (http://localhost:8000/dictionary/)  
  ![alt text](https://github.com/atanas3angelov/lmw/blob/main/index.jpg?raw=true)

  2. view words for a specific language (http://localhost:8000/dictionary/German/words/)  
  ![alt text](https://github.com/atanas3angelov/lmw/blob/main/words_for_specific_lang.jpg?raw=true)

  3. add new words into dictionary (http://localhost:8000/dictionary/German/forms/new_word/)  
  ![alt text](https://github.com/atanas3angelov/lmw/blob/main/adding_new_word.jpg?raw=true)

  4. practice setup (http://localhost:8000/practice/German/practice/)  
  ![alt text](https://github.com/atanas3angelov/lmw/blob/main/practice_setup.jpg?raw=true)

  5. direct text exercise  
  ![alt text](https://github.com/atanas3angelov/lmw/blob/main/direct_text.jpg?raw=true)  
  hidden keys: 0-plays audio for word (1-3 - selects gender radio, if exercise allows it)  

  6. multiple choice exercise  
  ![alt text](https://github.com/atanas3angelov/lmw/blob/main/multiple_choice.jpg?raw=true)  
  hidden keys: 0-plays audio for word, 1-3 - selects answer radio  

  7. multiple choice connect exercise  
  ![alt text](https://github.com/atanas3angelov/lmw/blob/main/multi_choice_connect.jpg?raw=true)  
  hidden keys: 1-4 - selects left word radio  

