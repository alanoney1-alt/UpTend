import requests, sys, json
from requests_oauthlib import OAuth1

auth = OAuth1(
    'ibNpDZfYIu1uiKNFg1AkRNzVu',
    '6Lz7RM0MHsDnxc9MkQURbJgQcHMktiKDz5ETvdyp5ZNpPZAv1H',
    '2024208922635358209-5PZjuSiamaL6opsXYk5ynDycpwvN2S',
    'Uwti491ShJPyfyOuMghIbvwxR1NJ9C1wDdTTGKwbBoeEO'
)

BEARER = 'AAAAAAAAAAAAAAAAAAAAAAui7wEAAAAAT353RhDt%2FCaGqeh4Lk2zd9mV05o%3DN5983iPy21E8hC5qAIA4PZU9loMcVeBs2htkOAjSrtZTItMynj'
bearer_headers = {'Authorization': f'Bearer {BEARER}'}

action = sys.argv[1]

if action == "post":
    text = sys.argv[2]
    resp = requests.post('https://api.twitter.com/2/tweets', json={"text": text}, auth=auth)
    print(resp.status_code, resp.text)

elif action == "reply":
    tweet_id = sys.argv[2]
    text = sys.argv[3]
    resp = requests.post('https://api.twitter.com/2/tweets', json={
        "text": text,
        "reply": {"in_reply_to_tweet_id": tweet_id}
    }, auth=auth)
    print(resp.status_code, resp.text)

elif action == "search":
    query = sys.argv[2]
    params = {
        "query": query,
        "max_results": 10,
        "tweet.fields": "author_id,created_at,public_metrics,text",
        "expansions": "author_id",
        "user.fields": "username,name,public_metrics"
    }
    resp = requests.get('https://api.twitter.com/2/tweets/search/recent', params=params, headers=bearer_headers)
    print(resp.status_code, resp.text)

elif action == "quote":
    quote_tweet_id = sys.argv[2]
    text = sys.argv[3]
    resp = requests.post('https://api.twitter.com/2/tweets', json={
        "text": text,
        "quote_tweet_id": quote_tweet_id
    }, auth=auth)
    print(resp.status_code, resp.text)

elif action == "delete":
    tweet_id = sys.argv[2]
    resp = requests.delete(f'https://api.twitter.com/2/tweets/{tweet_id}', auth=auth)
    print(resp.status_code, resp.text)

elif action == "user_tweets":
    username = sys.argv[2]
    # First get user ID
    resp = requests.get(f'https://api.twitter.com/2/users/by/username/{username}', headers=bearer_headers)
    data = resp.json()
    user_id = data['data']['id']
    # Then get tweets
    resp = requests.get(f'https://api.twitter.com/2/users/{user_id}/tweets', 
        params={"max_results": 5, "tweet.fields": "created_at,public_metrics,text"},
        headers=bearer_headers)
    print(resp.status_code, resp.text)

elif action == "follow":
    target_username = sys.argv[2]
    # Get target user ID
    resp = requests.get(f'https://api.twitter.com/2/users/by/username/{target_username}', headers=bearer_headers)
    target_id = resp.json()['data']['id']
    # Get our user ID
    me = requests.get('https://api.twitter.com/2/users/me', auth=auth)
    my_id = me.json()['data']['id']
    # Follow
    resp = requests.post(f'https://api.twitter.com/2/users/{my_id}/following', 
        json={"target_user_id": target_id}, auth=auth)
    print(resp.status_code, resp.text)
