from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def principal():
    return(render_template('Principal.html'))

if __name__ == '__main__':
    app.run(debug=True)
