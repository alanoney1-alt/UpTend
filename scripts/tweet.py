import requests, sys, json
from requests_oauthlib import OAuth1

auth = OAuth1(
    'ibNpDZfYIu1uiKNFg1AkRNzVu',
    '6Lz7RM0MHsDnxc9MkQURbJgQcHMktiKDz5ETvdyp5ZNpPZAv1H',
    '2024208922635358209-5PZjuSiamaL6opsXYk5ynDycpwvN2S',
    'Uwti491ShJPyfyOuMghIbvwxR1NJ9C1wDdTTGKwbBoeEO'
)

action = sys.argv[1]

if action == "post":
    text = sys.argv[2]
    resp = requests.post('https://api.twitter.com/2/tweets', json={"text": text}, auth=auth)
    print(resp.status_code, resp.text)
elif action == "delete":
    tweet_id = sys.argv[2]
    resp = requests.delete(f'https://api.twitter.com/2/tweets/{tweet_id}', auth=auth)
    print(resp.status_code, resp.text)
