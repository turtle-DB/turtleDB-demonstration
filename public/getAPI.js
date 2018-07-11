axios.get('https://omgvamp-hearthstone-v1.p.mashape.com/cards', {
  headers: { "X-Mashape-Key": "exwF4uzcSjmshVTq6PCSyIZ8ZcNPp1DTX4hjsn54BtBLs52Fz2"}
})
  .then(res => {
    console.log(res);
  })
