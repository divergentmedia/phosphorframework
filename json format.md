
#JSON format#

object {	
version:	int	//this doc describes version 1
timescale:	int	
hasAlpha:	boolean	
framesize:	object { //frame size (currently ignored by player)
	width:	int	
	height:	int	
	}	
frames:	array [	
	object {	//one object per frame.. pass object to blit callback
		x:	string	//frame blit description base64 encoded into string (defined below)
		d:	number	//frame display duration (in timescale defined above)
		m:  //optional user entered metadata will be returned in callback - any format
	}	
	//additonal frames
	]	
}


#Frame Blit Description#

The blit description is 1 or more blits packets, each prefaced by a PPS description. The PPS describes the attributes of the blit packets following it.
Format below is var name, followed by size _in bits_. Sizes in {} are based on values encoded previously in the stream.

##PPS##
blit_type	8 //describes the type of blit packet encoded (see list below)
src_image_index	8 //the source atlas image to blit from, if a frame is made of multiple src atlas images, multiple PPS must be encoded.
block_size	5	//pixel size of blits (width and height)
frame_type	3	//{0 = iFrame, 1 = pFrame }
blitcount	16	//number of blits in this pps, next PPS will start at next byte start after the last blit in this pps

//all the follwing bitdepth values encode the bitdepth of values encoded in the blit packets follwing this PPS
srcxy_bitdepth	4	//sx/y bitdepth (only need one, since we make sure src image is square
dest_x_bitdepth	4
dest_y_bitdepth	4	
src_w_bitdepth	4	
src_h_bitdepth	4	
dest_w_bitdepth	4	
dest_h_bitdepth	4	
reserved	52	//reserved


##Blit Packets##	
(if bitdepth for a value is defined as zero in the PPS, use 0 as retrieved value for further computation)

###Blit Type 1###
(currently blit type 1 is the only defined type)
Blit Type 1 copies a single block of size src_block_width x src_block_height, from the atlas image at index src_image_index at x,y offset of src_x, src_y into the canvas at offset dest_x, dest_y (scaling it to size of dest_block_width, dest_block_height if defined).

src_x	{srcxy_bitdepth}	//to retrieve nominal x multiply by block_size
src_y	{srcxy_bitdepth}	//to retrieve nominal y multiply by block_size
src_block_width	{src_w_bitdepth}	//computed as (1+value) in blocksize, to retrieve nominal pixel width multiply by block_size
src_block_height	{src_h_bitdepth}	//computed as (1+value) in blocksize, to retrieve nominal pixel height multiply by block_size
dest_x	{dest_x_bitdepth}	//to retrieve nominal x multiply by block_size
dest_y	{dest_y_bitdepth}	//to retrieve nominal y multiply by block_size
dest_block_width	{dest_w_bitdepth}	//computed as (1+value) in blocksize, to retrieve nominal pixel width multiply by block_size (if zero, then src size)
dest_block_height	{dest_h_bitdepth}	//computed as (1+value) in blocksize, to retrieve nominal pixel height multiply by block_size (if zero, then src size)